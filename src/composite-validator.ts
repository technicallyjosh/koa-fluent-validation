import { Validator, applyValidator } from './validator-builder';

export default class CompositeValidator implements Validator {
    public message: string;
    public args = [];

    private first: Validator;
    private second: Validator;

    public constructor(first: Validator, second: Validator) {
        this.message = '';
        this.first = first;
        this.second = second;
    }

    public fn(value: any) {
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
