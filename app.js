const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const pc = require('./priceCalculator');
 
const app = express(); // creat express application
const port = process.env.PORT || 3000;

app.use(morgan('combined'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ 
    extended: true
})); 

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs'); // do rendering - creating html

app.get('/', (req, res) => {
    res.redirect('/shop');
});

app.get('/shop', (req, res) => {
    fs.readFile('data/pizzaDescription.json', (error, fileData) => {
        if (error) {
            console.log("Unable to read data/pizzaDescription.json", error);
            res.status(500).send('Sorry, service temporary unavailable. Please try again later');
            return;
        }
        res.render('shop', JSON.parse(fileData));
    });
});

app.post('/cart', (req, res) => {
    fs.readFile('data/pizzaDescription.json', (error, fileData) => {
        if (error) {
            console.log("Unable to read ata/pizzaDescription.json", error);
            res.status(500).send('Sorry, service temporary unavailable. Please try again later');
            return;
        }

        const pizzaDescription = JSON.parse(fileData);

        function findToppings(reqTopping) {
            if(reqTopping === undefined || reqTopping === null) { //no topping has been selected
                return [];
            } else if(typeof reqTopping === 'string') { //single topping comes as string
                return [pizzaDescription.topping.find(e => e.id === reqTopping)];
            } else { //array of topings
                return reqTopping.map(e => pizzaDescription.topping.find(pizzaToping => pizzaToping.id === e))   
            }
        }

        const reqData = req.body;

        const order = {
            id: new Date().getTime(),
            crust: pizzaDescription.crust.find(e => e.id === reqData.crust),
            size: pizzaDescription.size.find(e => e.id === reqData.size),
            topping: findToppings(reqData.topping),
            quantity: reqData.quantity,
            name: reqData.name,
            address: reqData.address,
            phone: reqData.phone
        };

        const calc = new pc.Calculator();
        calc.calculatePrice(order);
        console.log(order);
   
        fs.writeFile(`./data/orders/draft/order-${order.id}.json`, JSON.stringify(order), function (err) {
            if (err) {
                console.log(`Unable to create draft order ${order.id}`, err);
                res.status(500).send('Could not save order');
                return;
            }
            console.log(`Draft order ${order.id} has been created`);
            res.render('cart', order);
        });
    }); 
    
});



app.get('/checkout', (req, res) => {
    const orderID = req.query.orderID;
    console.log(`Checking ourder order ${orderID}`);
    fs.rename(
        `./data/orders/draft/order-${orderID}.json`, 
        `./data/orders/submitted/order-${orderID}.json`,
        (error) => {
            if (error) {
                if(error.code !== 'ENOENT') { 
                    //ENOENT no such file entry. means order has been already submitted
                    console.log(error);
                    res.status(500).send('Could not checkout order');
                    return;
                }
            }
            res.render('checkout', {id: orderID});
        }
    );
});



app.listen(port, () => console.log('Express running → PORT '+ port)); // statr application

