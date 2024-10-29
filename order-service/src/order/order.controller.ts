// order-service/src/order/order.controller.ts
import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  PlaceOrderRequest,
  PlaceOrderResponse,
  GetOrderRequest,
  GetOrderResponse,
  GetOrdersRequest,
  GetOrdersResponse,
} from '../proto/order.pb';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'PlaceOrder')
  async placeOrderGrpc(data: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    const body = {
      userId: data.customerAddress,
      products: data.products,
      customerName: data.customerName, //TODO: we'll need to add this field to the Order entity
    };

    const order = await this.orderService.placeOrder(body);

    return { order };
  }

  @GrpcMethod('OrderService', 'GetOrders')
  async getOrders(data: GetOrdersRequest): Promise<GetOrdersResponse> {
    return { orders: await this.orderService.findAll() };
  }

  @GrpcMethod('OrderService', 'GetOrder')
  async getOrder(data: GetOrderRequest): Promise<GetOrderResponse> {
    const order = await this.orderService.findOne(data.orderId);

    const productIds = order.products.map((product) => product.productId);

    const products = await this.orderService.findProducts(productIds);

    order.products = products.map((product) => ({
      productId: product.id,
      quantity: order.products.find((p) => p.productId === product.id).quantity,
      ...product,
    }));

    return { order: await this.orderService.findOne(data.orderId) };
  }
}