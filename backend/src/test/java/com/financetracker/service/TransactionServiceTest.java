package com.financetracker.service;

import com.financetracker.dto.*;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Category;
import com.financetracker.model.Transaction;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private BlobStorageService blobStorageService;
    @Mock private TransactionEventPublisher eventPublisher;

    @InjectMocks
    private TransactionService transactionService;

    private static final String USER_ID = "user-1";

    private Transaction tx(String id, double amount, String type, String date) {
        return Transaction.builder()
                .id(id).userId(USER_ID).amount(amount).type(type).date(date)
                .createdAt(date + "T00:00:00Z").updatedAt(date + "T00:00:00Z")
                .build();
    }

    private void setMonthlyLimit(double limit) {
        ReflectionTestUtils.setField(transactionService, "monthlyLimit", limit);
    }

    // ---- create ----

    @Test
    void create_rejectsInvalidType() {
        TransactionRequest request = new TransactionRequest(10.0, "SAVINGS", null, "2026-05-01", null, null);

        assertThatThrownBy(() -> transactionService.create(USER_ID, request))
                .isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(transactionRepository, eventPublisher);
    }

    @Test
    void create_rejectsUnknownCategory() {
        TransactionRequest request = new TransactionRequest(10.0, "EXPENSE", null, "2026-05-01", "bad-cat", null);
        when(categoryRepository.findByIdAndUserId("bad-cat", USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.create(USER_ID, request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_savesTransactionAndPublishesEvent() {
        TransactionRequest request = new TransactionRequest(50.5, "expense", "  Lunch  ", "2026-05-01", null, null);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        TransactionDto dto = transactionService.create(USER_ID, request);

        assertThat(dto.amount()).isEqualTo(50.5);
        assertThat(dto.type()).isEqualTo("EXPENSE");
        assertThat(dto.description()).isEqualTo("Lunch");
        verify(eventPublisher).publish(eq("transaction.created"), eq(USER_ID), anyString(),
                eq(50.5), eq("EXPENSE"), any(), eq("2026-05-01"));
    }

    @Test
    void create_attachesCategoryDetailsWhenCategoryIdProvided() {
        Category category = Category.builder().id("cat-1").userId(USER_ID).name("Food")
                .color("#f97316").icon("🍔").build();
        when(categoryRepository.findByIdAndUserId("cat-1", USER_ID)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        TransactionRequest request = new TransactionRequest(20.0, "EXPENSE", null, "2026-05-01", "cat-1", null);
        TransactionDto dto = transactionService.create(USER_ID, request);

        assertThat(dto.category()).isNotNull();
        assertThat(dto.category().name()).isEqualTo("Food");
    }

    // ---- getOne / update / delete ----

    @Test
    void getOne_throwsNotFoundWhenMissing() {
        when(transactionRepository.findByIdAndUserId("missing", USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getOne(USER_ID, "missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_onlyChangesProvidedFields() {
        Transaction existing = tx("t1", 100.0, "EXPENSE", "2026-05-01");
        existing.setDescription("Original");
        when(transactionRepository.findByIdAndUserId("t1", USER_ID)).thenReturn(Optional.of(existing));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        TransactionRequest request = new TransactionRequest(0.0, null, null, null, null, null);
        TransactionDto dto = transactionService.update(USER_ID, "t1", request);

        assertThat(dto.amount()).isEqualTo(100.0);
        assertThat(dto.description()).isEqualTo("Original");
    }

    @Test
    void update_deletesOldReceiptWhenReplacedWithDifferentBlob() {
        Transaction existing = tx("t1", 100.0, "EXPENSE", "2026-05-01");
        existing.setReceiptBlobName("old-blob");
        when(transactionRepository.findByIdAndUserId("t1", USER_ID)).thenReturn(Optional.of(existing));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        TransactionRequest request = new TransactionRequest(0.0, null, null, null, null, "new-blob");
        transactionService.update(USER_ID, "t1", request);

        verify(blobStorageService).deleteIfExists("old-blob");
    }

    @Test
    void delete_removesReceiptFromBlobStorageWhenPresent() {
        Transaction existing = tx("t1", 100.0, "EXPENSE", "2026-05-01");
        existing.setReceiptBlobName("blob-1");
        when(transactionRepository.findByIdAndUserId("t1", USER_ID)).thenReturn(Optional.of(existing));

        transactionService.delete(USER_ID, "t1");

        verify(blobStorageService).deleteIfExists("blob-1");
        verify(transactionRepository).delete(existing);
        verify(eventPublisher).publish(eq("transaction.deleted"), eq(USER_ID), eq("t1"),
                anyDouble(), anyString(), any(), anyString());
    }

    @Test
    void delete_throwsNotFoundWhenMissing() {
        when(transactionRepository.findByIdAndUserId("missing", USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.delete(USER_ID, "missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---- receipt url ----

    @Test
    void getReceiptUrl_throwsWhenNoReceiptAttached() {
        Transaction existing = tx("t1", 10.0, "EXPENSE", "2026-05-01");
        when(transactionRepository.findByIdAndUserId("t1", USER_ID)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> transactionService.getReceiptUrl(USER_ID, "t1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getReceiptUrl_delegatesToBlobStorageService() {
        Transaction existing = tx("t1", 10.0, "EXPENSE", "2026-05-01");
        existing.setReceiptBlobName("blob-1");
        when(transactionRepository.findByIdAndUserId("t1", USER_ID)).thenReturn(Optional.of(existing));
        when(blobStorageService.generateSasUrl("blob-1")).thenReturn("https://example.com/sas");

        String url = transactionService.getReceiptUrl(USER_ID, "t1");

        assertThat(url).isEqualTo("https://example.com/sas");
    }

    // ---- list: filtering & pagination ----

    @Test
    void list_filtersByTypeAndCategoryAndPaginates() {
        List<Transaction> all = List.of(
                withCategory(tx("t1", 10, "EXPENSE", "2026-05-05"), "cat-a"),
                withCategory(tx("t2", 20, "INCOME", "2026-05-04"), "cat-a"),
                withCategory(tx("t3", 30, "EXPENSE", "2026-05-03"), "cat-b"),
                withCategory(tx("t4", 40, "EXPENSE", "2026-05-02"), "cat-a"),
                withCategory(tx("t5", 50, "EXPENSE", "2026-05-01"), "cat-a")
        );
        when(transactionRepository.findByUserId(USER_ID)).thenReturn(all);

        Map<String, Object> page1 = transactionService.list(USER_ID, "EXPENSE", "cat-a", null, null, 1, 2);

        @SuppressWarnings("unchecked")
        List<TransactionDto> dtos = (List<TransactionDto>) page1.get("transactions");
        @SuppressWarnings("unchecked")
        Map<String, Object> pagination = (Map<String, Object>) page1.get("pagination");

        // cat-a EXPENSE transactions are t1, t4, t5 -> 3 total, newest first
        assertThat(dtos).extracting(TransactionDto::id).containsExactly("t1", "t4");
        assertThat(pagination.get("total")).isEqualTo(3);
        assertThat(pagination.get("pages")).isEqualTo(2);
    }

    @Test
    void list_clampsLimitToMaximumOfOneHundred() {
        when(transactionRepository.findByUserId(USER_ID)).thenReturn(List.of(tx("t1", 10, "EXPENSE", "2026-05-01")));

        Map<String, Object> result = transactionService.list(USER_ID, null, null, null, null, 1, 500);

        @SuppressWarnings("unchecked")
        Map<String, Object> pagination = (Map<String, Object>) result.get("pagination");
        assertThat(pagination.get("limit")).isEqualTo(100);
    }

    @Test
    void list_usesDateRangeQueryWhenMonthAndYearProvided() {
        when(transactionRepository.findByUserIdAndDateRange(eq(USER_ID), anyString(), anyString()))
                .thenReturn(List.of());

        transactionService.list(USER_ID, null, null, 5, 2026, 1, 20);

        verify(transactionRepository).findByUserIdAndDateRange(USER_ID, "2026-05-01", "2026-06-01");
        verify(transactionRepository, never()).findByUserId(anyString());
    }

    private Transaction withCategory(Transaction t, String categoryId) {
        t.setCategoryId(categoryId);
        return t;
    }

    // ---- summary / balance / budget ----

    @Test
    void summary_computesIncomeExpensesAndBalanceForGivenMonth() {
        when(transactionRepository.findByUserIdAndDateRange(USER_ID, "2026-05-01", "2026-06-01"))
                .thenReturn(List.of(
                        tx("t1", 1000, "INCOME", "2026-05-01"),
                        tx("t2", 200, "EXPENSE", "2026-05-10"),
                        tx("t3", 100, "EXPENSE", "2026-05-15")
                ));

        SummaryResponse summary = transactionService.summary(USER_ID, 5, 2026);

        assertThat(summary.income()).isEqualTo(1000);
        assertThat(summary.expenses()).isEqualTo(300);
        assertThat(summary.balance()).isEqualTo(700);
        assertThat(summary.incomeCount()).isEqualTo(1);
        assertThat(summary.expenseCount()).isEqualTo(2);
    }

    @Test
    void allTimeBalance_sumsAcrossAllTransactions() {
        when(transactionRepository.findByUserId(USER_ID)).thenReturn(List.of(
                tx("t1", 500, "INCOME", "2026-01-01"),
                tx("t2", 150, "EXPENSE", "2026-05-01")
        ));

        BalanceResponse balance = transactionService.allTimeBalance(USER_ID);

        assertThat(balance.totalIncome()).isEqualTo(500);
        assertThat(balance.totalExpenses()).isEqualTo(150);
        assertThat(balance.totalBalance()).isEqualTo(350);
    }

    @Test
    void categoryBreakdown_groupsExpensesByCategoryAndSortsDescending() {
        when(transactionRepository.findByUserIdAndDateRange(USER_ID, "2026-05-01", "2026-06-01"))
                .thenReturn(List.of(
                        withCategoryDetails(tx("t1", 30, "EXPENSE", "2026-05-01"), "cat-a", "Food"),
                        withCategoryDetails(tx("t2", 70, "EXPENSE", "2026-05-02"), "cat-b", "Transport"),
                        withCategoryDetails(tx("t3", 20, "EXPENSE", "2026-05-03"), "cat-a", "Food"),
                        tx("t4", 1000, "INCOME", "2026-05-04")
                ));

        List<CategoryBreakdownItem> breakdown = transactionService.categoryBreakdown(USER_ID, 5, 2026);

        assertThat(breakdown).hasSize(2);
        assertThat(breakdown.get(0).name()).isEqualTo("Transport");
        assertThat(breakdown.get(0).amount()).isEqualTo(70);
        assertThat(breakdown.get(1).name()).isEqualTo("Food");
        assertThat(breakdown.get(1).amount()).isEqualTo(50);
    }

    @Test
    void categoryBreakdown_groupsUncategorizedExpensesTogether() {
        when(transactionRepository.findByUserIdAndDateRange(USER_ID, "2026-05-01", "2026-06-01"))
                .thenReturn(List.of(
                        tx("t1", 15, "EXPENSE", "2026-05-01"),
                        tx("t2", 25, "EXPENSE", "2026-05-02")
                ));

        List<CategoryBreakdownItem> breakdown = transactionService.categoryBreakdown(USER_ID, 5, 2026);

        assertThat(breakdown).hasSize(1);
        assertThat(breakdown.get(0).name()).isEqualTo("Uncategorized");
        assertThat(breakdown.get(0).amount()).isEqualTo(40);
    }

    private Transaction withCategoryDetails(Transaction t, String categoryId, String categoryName) {
        t.setCategoryId(categoryId);
        t.setCategoryName(categoryName);
        return t;
    }

    @Test
    void budgetStatus_flagsExceededWhenExpensesAboveLimit() {
        setMonthlyLimit(100.0);
        when(transactionRepository.findByUserIdAndDateRange(USER_ID, "2026-05-01", "2026-06-01"))
                .thenReturn(List.of(tx("t1", 150, "EXPENSE", "2026-05-01")));

        BudgetStatusResponse status = transactionService.budgetStatus(USER_ID, 5, 2026);

        assertThat(status.exceeded()).isTrue();
        assertThat(status.percentage()).isEqualTo(150);
        assertThat(status.monthlyLimit()).isEqualTo(100.0);
    }

    @Test
    void budgetStatus_notExceededWhenUnderLimit() {
        setMonthlyLimit(500.0);
        when(transactionRepository.findByUserIdAndDateRange(USER_ID, "2026-05-01", "2026-06-01"))
                .thenReturn(List.of(tx("t1", 50, "EXPENSE", "2026-05-01")));

        BudgetStatusResponse status = transactionService.budgetStatus(USER_ID, 5, 2026);

        assertThat(status.exceeded()).isFalse();
        assertThat(status.percentage()).isEqualTo(10);
    }
}
