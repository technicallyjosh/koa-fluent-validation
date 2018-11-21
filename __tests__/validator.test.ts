import Koa from 'koa';
import { validation } from '../dist';

describe('validator()', () => {
    test('should be a function', () => {
        expect(typeof validation).toBe('function');
    });

    test('should return an async function', () => {
        expect(validation().constructor.name).toBe('AsyncFunction');
    });

    test('should apply properties on the context', async () => {
        const middleware = validation();
        const context = {} as Koa.Context;

        await middleware(
            context,
            () =>
                new Promise(resolve => {
                    resolve();
                }),
        );

        expect(typeof context.validateBody).toBe('function');
        expect(typeof context.validateParams).toBe('function');
        expect(typeof context.validateQuery).toBe('function');
        expect(typeof context.validateHeaders).toBe('function');
        expect(context).toHaveProperty('validationErrors');
    });
});
