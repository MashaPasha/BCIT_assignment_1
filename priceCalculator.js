class Calculator {

    calculatePrice(order){
        function sum(total, num) {
            return total + num;
        }

        const toppingPrice = order.topping
            .map(e => e.price)
            .reduce(sum, 0); //sum all array elements into one
        
        // multiply by 100 and devide to avoid rounding error and weird 0.00000000000001 price
        order.price = Math.round((order.size.price + toppingPrice) * order.quantity * 100) / 100;
        order.taxPST = Math.round(order.price * 7) / 100;
        order.taxGST = Math.round(order.price * 5) / 100;
        order.totalPrice = Math.round((order.price + order.taxPST + order.taxGST) * 100)  / 100;
    }
}

exports.Calculator = Calculator;