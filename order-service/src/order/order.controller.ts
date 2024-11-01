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
} from '../generated/order';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'PlaceOrder')
  async placeOrderGrpc(data: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    const order = await this.orderService.placeOrder(data);

    return { order };
  }

  @GrpcMethod('OrderService', 'GetOrders')
  async getOrders(data: GetOrdersRequest): Promise<GetOrdersResponse> {
    return { orders: await this.orderService.findAll() };
  }

  @GrpcMethod('OrderService', 'GetOrder')
  async getOrder(data: GetOrderRequest): Promise<GetOrderResponse> {
    return {
      order: await this.orderService.FindOrderWithProducts(data.orderId),
    };
  }
}
