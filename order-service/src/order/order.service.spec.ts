import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Repository } from 'typeorm';
import { ProductService } from '../proto/product.pb';
import { ClientGrpc } from '@nestjs/microservices';

describe('OrderService', () => {
  let service: OrderService;
  let repository: Repository<Order>;
  let productService: ProductService;

  beforeEach(async () => {
    const mockGrpcClient = {
      getService: jest.fn().mockReturnValue({
        FindOne: jest.fn(),
        DecreaseQuantity: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useClass: Repository,
        },
        {
          provide: 'PRODUCT_PACKAGE',
          useValue: mockGrpcClient,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get<Repository<Order>>(getRepositoryToken(Order));
    productService = module
      .get<ClientGrpc>('PRODUCT_PACKAGE')
      .getService('ProductService');

    // Adding mock implementations directly to productService using Promises
    jest.spyOn(productService, 'FindOne').mockImplementation(({ id }) => {
      return Promise.resolve({
        product: {
          id,
          name: 'Product',
          description: 'Description',
          price: 100,
          availableQuantity: 10,
        },
      });
    });

    jest
      .spyOn(productService, 'DecreaseQuantity')
      .mockImplementation(({ id, quantity }) => {
        if (quantity > 10) {
          return Promise.resolve({ success: false });
        }
        return Promise.resolve({ success: true });
      });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be able to place an order', () => {
    expect(service.placeOrder).toBeDefined();
  });

  it('should be defined as productService', () => {
    expect(productService).toBeDefined();
  });

  it('should place an order', async () => {
    const orderData = {
      products: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 3 },
      ],
    };

    const createdOrder = { id: 1, products: orderData.products, total: 500 };
    jest.spyOn(repository, 'create').mockReturnValue(createdOrder as Order);
    jest.spyOn(repository, 'save').mockResolvedValue(createdOrder as Order);

    const result = await service.placeOrder(orderData);
    expect(result).toEqual(createdOrder);
  });

  it('should retrieve all orders', async () => {
    const orders = [
      { id: 1, total: 100 },
      { id: 2, total: 200 },
    ];
    jest.spyOn(repository, 'find').mockResolvedValue(orders as Order[]);

    expect(await service.findAll()).toEqual(orders);
  });

  it('should retrieve a single order by ID', async () => {
    const order = { id: 1, total: 100 };
    jest.spyOn(repository, 'findOne').mockResolvedValue(order as Order);

    expect(await service.findOne(1)).toEqual(order);
  });
});
