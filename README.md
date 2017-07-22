# koa-fluent-validation

**THIS IS NOT PUBLISHED YET AND IS A WORK IN PROGRESS**

Fluent, functional, and extendable validation for Koa 2 body, params, and query. Built on [validator](https://github.com/chriso/validator.js/) for base validations and filters.

**This only works for Koa 2 and Node v7.6+**

## Usage
This is built with TypeScript targeting ECMA 2017 as the output. You will get type definitions when using with TypeScript and of course you can use vanilla JavaScript.

Map files are included so you can debug if you are using VS Code or similar for TypeScript debugging.

For a more common implementation, all examples will be in JavaScript.

### Simple App Example
```js
const Koa = require('koa');
const bodyparser = require('koa-bodyparser');
const { validator, v, f } = require('koa-fluent-validation');

const app = new Koa();

app.use(bodyparser());
app.use(validator());

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (e) {
        if (e.status === 422) {
            ctx.body = ctx.validationErrors;
            return;
        }

        // ... some other handling here etc
    }
});

// simple post route
app.use(async (ctx, next) => {
    if (ctx.method !== 'POST') {
        ctx.throw(404);
        return;
    }

    ctx.validateBody({
        firstName: v().required().string(),
        lastName: v().required().string()
    }, {
        firstName: f().trim(),
        lastName: f().trim()
    });

    // your code here
});

app.listen(8080);
```

## Documentation

**For documentation see the [wiki](https://github.com/technicallyjosh/koa-fluent-validation/wiki)!**