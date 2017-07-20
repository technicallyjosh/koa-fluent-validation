# koa-fluent-validation

Fluent, functional, and extendable validation for Koa 2 body, params, and query. Built on [validator](https://github.com/chriso/validator.js/) for base validations and filters.

**This only works for Koa 2 and Node v7.6+**

## Usage

This was built with TypeScript with ECMA 2017 in mind as the target output. You will get type definitions when using with TypeScript and of course you can use vanilla JavaScript.

Map files are included so you can debug if you are using VS Code or similar for TypeScript debugging.

For a more common implementation, all examples will be in JavaScript.

### Sample App

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
        username: v().required().string(),
        password: v().required().string()
    });

    // it passed! do something here
});

app.listen(8080);
```