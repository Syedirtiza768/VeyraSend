import {
  Body, Controller, Get, HttpCode, Param, Post,
} from '@nestjs/common';
import {
  IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { InvoicesService } from './invoices.service';
import { PaymentLinksService } from './payment-links.service';

class LineItemDto {
  @IsString() @MaxLength(255) description!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsInt() @Min(1) unitAmountCents!: number;
}

class CreateInvoiceDto {
  @IsUUID() contactId!: string;
  @ValidateNested({ each: true }) @Type(() => LineItemDto)
  lineItems!: LineItemDto[];
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsOptional() @IsString() dueDate?: string | null;
}

class CreatePaymentLinkDto {
  @IsInt() @Min(1) amountCents!: number;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsOptional() @IsString() @MaxLength(255) description?: string;
  @IsOptional() @IsUUID() contactId?: string;
  @IsOptional() @IsBoolean() sendSms?: boolean;
}

@Controller('billing')
export class BillingController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly paymentLinks: PaymentLinksService,
  ) {}

  @Get('invoices')
  @Permissions('billing:read')
  listInvoices(@CurrentUser() user: AuthUser) {
    return this.invoices.list(user.tenantId);
  }

  @Get('invoices/:id')
  @Permissions('billing:read')
  getInvoice(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoices.getById(user.tenantId, id);
  }

  @Post('invoices')
  @Permissions('billing:write')
  @HttpCode(201)
  createInvoice(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(user.tenantId, dto);
  }

  @Post('invoices/:id/send')
  @Permissions('billing:write')
  @HttpCode(200)
  sendInvoice(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoices.send(user.tenantId, user.userId, id);
  }

  @Get('payment-links')
  @Permissions('billing:read')
  listPaymentLinks(@CurrentUser() user: AuthUser) {
    return this.paymentLinks.list(user.tenantId);
  }

  @Post('payment-links')
  @Permissions('billing:write')
  @HttpCode(201)
  createPaymentLink(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentLinkDto) {
    return this.paymentLinks.create(user.tenantId, dto);
  }
}
