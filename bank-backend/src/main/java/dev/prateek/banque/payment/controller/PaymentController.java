package dev.prateek.banque.payment.controller;

import dev.prateek.banque.payment.dto.*;
import dev.prateek.banque.payment.service.PaymentService;
import dev.prateek.banque.user.dto.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/payments")
@PreAuthorize("isAuthenticated()")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Make bill payment
     */
    @PostMapping("/bills")
    public ResponseEntity<PaymentResponse> payBill(
            @Valid @RequestBody BillPaymentRequest request
    ) {
        try {
            PaymentResponse payment = paymentService.payBill(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Make utility payment (electricity, water, gas, etc.)
     */
    @PostMapping("/utilities")
    public ResponseEntity<PaymentResponse> payUtility(
            @Valid @RequestBody UtilityPaymentRequest request
    ) {
        try {
            PaymentResponse payment = paymentService.payUtility(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Make merchant payment
     */
    @PostMapping("/merchants")
    public ResponseEntity<PaymentResponse> payMerchant(
            @Valid @RequestBody MerchantPaymentRequest request
    ) {
        try {
            PaymentResponse payment = paymentService.payMerchant(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Schedule payment
     */
    @PostMapping("/scheduled")
    public ResponseEntity<PaymentResponse> schedulePayment(
            @Valid @RequestBody SchedulePaymentRequest request
    ) {
        try {
            PaymentResponse payment = paymentService.schedulePayment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Create recurring payment
     */
    @PostMapping("/recurring")
    public ResponseEntity<RecurringPaymentResponse> createRecurringPayment(
            @Valid @RequestBody RecurringPaymentRequest request
    ) {
        try {
            RecurringPaymentResponse payment = paymentService.createRecurringPayment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all payments with filters
     */
    @GetMapping
    public ResponseEntity<Page<PaymentResponse>> getAllPayments(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<PaymentResponse> payments = paymentService.getPayments(
                    accountId, type, category, status, startDate, endDate, pageable
            );
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get payment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable Long id) {
        try {
            PaymentResponse payment = paymentService.getPaymentById(id);
            return ResponseEntity.ok(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get pending payments
     */
    @GetMapping("/pending")
    public ResponseEntity<Page<PaymentResponse>> getPendingPayments(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<PaymentResponse> payments = paymentService.getPendingPayments(pageable);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get scheduled payments
     */
    @GetMapping("/scheduled")
    public ResponseEntity<Page<PaymentResponse>> getScheduledPayments(
            @PageableDefault(size = 20, sort = "scheduledDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        try {
            Page<PaymentResponse> payments = paymentService.getScheduledPayments(pageable);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get recurring payments
     */
    @GetMapping("/recurring")
    public ResponseEntity<Page<RecurringPaymentResponse>> getRecurringPayments(
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<RecurringPaymentResponse> payments = paymentService.getRecurringPayments(
                    activeOnly, pageable
            );
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get saved billers
     */
    @GetMapping("/billers")
    public ResponseEntity<Page<SavedBillerResponse>> getSavedBillers(
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<SavedBillerResponse> billers = paymentService.getSavedBillers(category, pageable);
            return ResponseEntity.ok(billers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Save biller
     */
    @PostMapping("/billers")
    public ResponseEntity<SavedBillerResponse> saveBiller(
            @Valid @RequestBody SaveBillerRequest request
    ) {
        try {
            SavedBillerResponse biller = paymentService.saveBiller(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(biller);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete saved biller
     */
    @DeleteMapping("/billers/{id}")
    public ResponseEntity<MessageResponse> deleteBiller(@PathVariable Long id) {
        try {
            paymentService.deleteBiller(id);
            return ResponseEntity.ok(new MessageResponse("Biller deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Cancel payment
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<MessageResponse> cancelPayment(@PathVariable Long id) {
        try {
            paymentService.cancelPayment(id);
            return ResponseEntity.ok(new MessageResponse("Payment cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Cancel recurring payment
     */
    @PostMapping("/recurring/{id}/cancel")
    public ResponseEntity<MessageResponse> cancelRecurringPayment(@PathVariable Long id) {
        try {
            paymentService.cancelRecurringPayment(id);
            return ResponseEntity.ok(new MessageResponse("Recurring payment cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Get payment receipt
     */
    @GetMapping("/{id}/receipt")
    public ResponseEntity<PaymentReceiptResponse> getReceipt(@PathVariable Long id) {
        try {
            PaymentReceiptResponse receipt = paymentService.getPaymentReceipt(id);
            return ResponseEntity.ok(receipt);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get payment statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<PaymentStatisticsResponse> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            PaymentStatisticsResponse statistics = paymentService.getPaymentStatistics(
                    startDate, endDate
            );
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get payment categories
     */
    @GetMapping("/categories")
    public ResponseEntity<PaymentCategoriesResponse> getCategories() {
        try {
            PaymentCategoriesResponse categories = paymentService.getPaymentCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Payment service is running");
    }
}
