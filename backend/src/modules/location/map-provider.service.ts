import { Injectable } from '@nestjs/common';

@Injectable()
export class MapProviderService {
    getGoogleMapsLink(lat: number, lng: number): string {
        return `https://www.google.com/maps?q=${lat},${lng}`;
    }
}

