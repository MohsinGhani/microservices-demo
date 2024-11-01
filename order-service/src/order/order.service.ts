import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ProductService,
  FindOneRequest,
  DecreaseQuantityRequest,
  Product,
} from '../generated/product';
import { from, lastValueFrom } from 'rxjs';
import {
  PlaceOrderRequest,
  Order as OrderProtoType,
  FullOrder,
} from '../generated/order';
import { Order } from './order.entity';
import { status as grpcStatus } from '@grpc/grpc-js';

@Injectable()
export class OrderService {
  private productService: ProductService;

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @Inject('PRODUCT_PACKAGE') private client: ClientGrpc,
  ) {
    this.productService =
      this.client.getService<ProductService>('ProductService');
  }

  async placeOrder(orderData: PlaceOrderRequest): Promise<OrderProtoType> {
    let total = 0;

    const productPromises = orderData.products.map(async (item) => {
      // Find product details by productId
      const response = await lastValueFrom(
        from(
          this.productService.FindOne({ id: item.productId } as FindOneRequest),
        ),
      );

      if (!response.product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      const product = response.product;

      if (product.availableQuantity < item.quantity) {
        throw new HttpException(
          `Insufficient quantity for product ID ${item.productId}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Decrease product quantity
      const decreaseResponse = await lastValueFrom(
        from(
          this.productService.DecreaseQuantity({
            id: item.productId,
            quantity: item.quantity,
          } as DecreaseQuantityRequest),
        ),
      );

      if (!decreaseResponse.success) {
        throw new Error(
          `Failed to decrease quantity for product ID ${item.productId}`,
        );
      }

      // Calculate total price
      total += product.price * item.quantity;

      return {
        productId: item.productId,
        quantity: item.quantity,
      };
    });

    // Wait for all product checks to complete
    const products = await Promise.all(productPromises);

    // Create and save the order
    const order = this.orderRepository.create({
      products,
      total,
      customerName: orderData.customerName,
      customerId: Number(orderData.customerId),
    });

    return this.orderRepository.save(order);
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  findOne(id: number): Promise<Order> {
    return this.orderRepository.findOne({ where: { id } });
  }

  async FindOrderWithProducts(orderId: number): Promise<FullOrder> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      // Map HTTP NOT_FOUND to gRPC NOT_FOUND
      throw {
        code: grpcStatus.NOT_FOUND,
        message: 'Order not found',
      };
    }

    const productIds = order.products.map((product) => product.productId);

    const products = await this.findProducts(productIds);

    if (order && order.products) {
      order.products = products.map((product) => ({
        productId: product.id,
        quantity: order.products.find((p) => p.productId === product.id)
          ?.quantity,
        ...product,
      }));
    }

    return order as unknown as FullOrder;
  }

  async findProducts(productIds: number[]): Promise<Product[]> {
    const response = await lastValueFrom(
      from(this.productService.FindByIds({ ids: productIds })),
    );
    return response.products;
  }
}
