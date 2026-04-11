// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.config;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.DoubleAdder;

@Service
public class TransactionMetricsService {

    private final AtomicLong successCount = new AtomicLong();
    private final AtomicLong errorCount = new AtomicLong();
    private final DoubleAdder totalAmount = new DoubleAdder();

    public TransactionMetricsService(MeterRegistry meterRegistry) {
        Gauge.builder("banque.transactions", successCount, AtomicLong::doubleValue)
                .description("Total successful Banque transactions")
                .tag("kpi", "count")
                .register(meterRegistry);

        Gauge.builder("banque.transactions", this, TransactionMetricsService::averageAmount)
                .description("Average amount across successful Banque transactions")
                .tag("kpi", "avg_amount")
                .register(meterRegistry);

        Gauge.builder("banque.transactions", this, TransactionMetricsService::errorRate)
                .description("Share of Banque transactions ending in error")
                .tag("kpi", "error_rate")
                .register(meterRegistry);
    }

    public void recordSuccess(BigDecimal amount) {
        successCount.incrementAndGet();
        totalAmount.add(amount.doubleValue());
    }

    public void recordError() {
        errorCount.incrementAndGet();
    }

    private double averageAmount() {
        long count = successCount.get();
        return count == 0 ? 0.0 : totalAmount.sum() / count;
    }

    private double errorRate() {
        long total = successCount.get() + errorCount.get();
        return total == 0 ? 0.0 : (double) errorCount.get() / total;
    }
}
