import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { isValidGlobalPhone } from '../utils/phone.util';

export function IsGlobalPhone(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isGlobalPhone',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    return typeof value === 'string' && isValidGlobalPhone(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a valid E.164 phone number with country code, using 8 to 15 digits`;
                },
            },
        });
    };
}
