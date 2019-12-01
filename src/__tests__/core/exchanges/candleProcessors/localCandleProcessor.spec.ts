import moment from "moment";
import LocalOrderFiller from "../../../../sockTrader/core/exchanges/orderFillers/localOrderFiller";
import OrderTracker from "../../../../sockTrader/core/order/orderTracker";
import LocalExchange from "../../../../sockTrader/core/exchanges/localExchange";
import {IOrder, OrderSide} from "../../../../sockTrader/core/types/order";
import {ICandle} from "../../../../sockTrader/core/types/ICandle";
import Wallet from "../../../../sockTrader/core/plugins/wallet/wallet";

function createOrderFiller() {
    const tracker = new OrderTracker();
    tracker.setOpenOrders([{
        id: "123",
        pair: ["BTC", "USD"],
        side: OrderSide.BUY,
        price: 10,
        createdAt: moment(),
    } as IOrder]);

    return new LocalOrderFiller(tracker, new LocalExchange(), new Wallet({BTC: 10, USD: 10000}));
}

const fillCandles = [{low: 5, timestamp: moment().add(1, "day")}] as ICandle[];
const notFillCandles = [{low: 15, timestamp: moment().add(1, "day")}] as ICandle[];

let orderFiller = createOrderFiller();
beforeEach(() => {
    orderFiller = createOrderFiller();
});

describe("onSnapshotCandles", () => {
    test("Should process open orders", () => {
        const spy = jest.spyOn(orderFiller, "processOpenOrders" as any);
        orderFiller.onSnapshotCandles(["BTC", "USD"], fillCandles, {code: "code", cron: "*"});

        expect(spy).toBeCalledWith({low: 5, timestamp: expect.any(moment)});
    });
});

describe("onUpdateCandles", () => {
    test("Should process open orders", () => {
        const spy = jest.spyOn(orderFiller, "processOpenOrders" as any);
        orderFiller.onUpdateCandles(["BTC", "USD"], fillCandles, {code: "code", cron: "*"});

        expect(spy).toBeCalledWith({low: 5, timestamp: expect.any(moment)});
    });
});

describe("onProcessCandles", () => {
    test("Should set empty array in OrderTracker when all orders are filled", () => {
        const spy = jest.spyOn(candleProcessor["orderTracker"], "setOpenOrders");

        candleProcessor.onProcessCandles(fillCandles);
        expect(spy).toBeCalledWith([]);
    });

    test("Should set all open orders in OrderTracker", () => {
        const spy = jest.spyOn(candleProcessor["orderTracker"], "setOpenOrders");

        candleProcessor.onProcessCandles(notFillCandles);
        expect(spy).toBeCalledWith([expect.objectContaining({
            createdAt: expect.any(moment),
            id: "123",
            price: 10,
            side: OrderSide.BUY
        })]);
    });

    test("Should notify exchange about the filled order", () => {
        const spy = jest.spyOn(candleProcessor["exchange"], "onReport");

        candleProcessor.onProcessCandles(fillCandles);
        expect(spy).toBeCalledWith(expect.objectContaining({
            createdAt: expect.any(moment),
            id: "123",
            price: 10,
            side: OrderSide.BUY,
            reportType: ReportType.TRADE,
            status: OrderStatus.FILLED,
        }));
    });
});
