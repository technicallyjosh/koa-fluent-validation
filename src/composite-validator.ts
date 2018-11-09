import { IValidator, applyValidator } from './validator-builder';

export default class CompositeValidator implements IValidator {
    message: string;
    args = [];

    constructor(private first: IValidator, private second: IValidator) {
        this.message = '';
    }

    fn(value: any) {
        if (!applyValidator(this.first, value)) {
            this.message = this.first.message;
            return false;
        }

        if (!applyValidator(this.second, value)) {
            this.message = this.second.message;
            return false;
        }

        return true;
    }
}
