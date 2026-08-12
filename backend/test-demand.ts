import { NestFactory } from '@nestjs/core'; 
import { AppModule } from './src/app.module'; 
import { DemandService } from './src/modules/demand/demand.service'; 

async function bootstrap() { 
    const app = await NestFactory.createApplicationContext(AppModule); 
    const demandService = app.get(DemandService); 
    try { 
        const res = await demandService.getOverview(); 
        console.log("SUCCESS"); 
    } catch(e) { 
        console.error('ERROR OCCURRED:', e); 
    } 
    await app.close(); 
} 
bootstrap();
