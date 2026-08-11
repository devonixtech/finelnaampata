import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { Transaction } from '../src/entities/transaction.entity';
import Stripe from 'stripe';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-04-10' as any });
    const repo = app.get<Repository<Transaction>>('TransactionRepository');
    
    const transactions = await repo.find({ where: { paymentGateway: 'Stripe' } });
    console.log(`Found ${transactions.length} Stripe transactions...`);
    
    let updated = 0;
    for (const t of transactions) {
        if (t.invoiceUrl) continue;
        if (!t.gatewayTransactionId) continue;
        
        try {
            if (t.gatewayTransactionId.startsWith('cs_')) {
                const session = await stripe.checkout.sessions.retrieve(t.gatewayTransactionId, {
                    expand: ['payment_intent', 'payment_intent.latest_charge']
                });
                if (session.payment_intent && (session.payment_intent as any).latest_charge) {
                    const url = ((session.payment_intent as any).latest_charge as any).receipt_url;
                    if (url) {
                        t.invoiceUrl = url;
                        await repo.save(t);
                        console.log(`Updated ${t.id} -> ${url}`);
                        updated++;
                    }
                }
            } else if (t.gatewayTransactionId.startsWith('in_')) {
                const invoice = await stripe.invoices.retrieve(t.gatewayTransactionId);
                if (invoice.hosted_invoice_url) {
                    t.invoiceUrl = invoice.hosted_invoice_url;
                    await repo.save(t);
                    console.log(`Updated ${t.id} -> ${invoice.hosted_invoice_url}`);
                    updated++;
                }
            }
        } catch (e: any) {
            console.error(`Failed for ${t.id}: ${e.message}`);
        }
    }
    
    console.log(`Updated ${updated} transactions.`);
    await app.close();
}
bootstrap();
