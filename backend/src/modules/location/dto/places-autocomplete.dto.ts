import { IsOptional, IsString, MinLength } from 'class-validator';

export class PlacesAutocompleteQueryDto {
    @IsString()
    @MinLength(3)
    input: string;

    @IsString()
    sessionToken: string;

    @IsOptional()
    @IsString()
    countryCode?: string;
}

export class PlaceDetailsQueryDto {
    @IsString()
    sessionToken: string;

    @IsOptional()
    @IsString()
    countryCode?: string;
}
