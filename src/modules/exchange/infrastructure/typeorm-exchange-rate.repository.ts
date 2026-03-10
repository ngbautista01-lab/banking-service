import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../../../common/domain/currency.enum';
import {
  ExchangeRateRepository,
  FindDuplicateExchangeRateParams,
} from '../application/ports/exchange-rate.repository';
import { ExchangeRateEntity } from '../domain/exchange-rate.entity';

@Injectable()
export class TypeOrmExchangeRateRepository implements ExchangeRateRepository {
  constructor(
    @InjectRepository(ExchangeRateEntity)
    private readonly repository: Repository<ExchangeRateEntity>,
  ) {}

  create(data: Partial<ExchangeRateEntity>): ExchangeRateEntity {
    return this.repository.create(data);
  }

  save(rate: ExchangeRateEntity): Promise<ExchangeRateEntity> {
    return this.repository.save(rate);
  }

  findAll(): Promise<ExchangeRateEntity[]> {
    return this.repository.find({
      order: { effectiveAt: 'DESC', createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<ExchangeRateEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findDuplicate({
    baseCurrency,
    quoteCurrency,
    effectiveAt,
    excludeId,
  }: FindDuplicateExchangeRateParams): Promise<ExchangeRateEntity | null> {
    const qb = this.repository
      .createQueryBuilder('exchangeRate')
      .where('exchangeRate.baseCurrency = :baseCurrency', { baseCurrency })
      .andWhere('exchangeRate.quoteCurrency = :quoteCurrency', { quoteCurrency })
      .andWhere('exchangeRate.effectiveAt = :effectiveAt', { effectiveAt });

    if (excludeId) {
      qb.andWhere('exchangeRate.id != :excludeId', { excludeId });
    }

    return qb.getOne();
  }

  findLatest(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    effectiveAt?: Date,
  ): Promise<ExchangeRateEntity | null> {
    const qb = this.repository
      .createQueryBuilder('exchangeRate')
      .where('exchangeRate.baseCurrency = :baseCurrency', { baseCurrency })
      .andWhere('exchangeRate.quoteCurrency = :quoteCurrency', { quoteCurrency });

    if (effectiveAt) {
      qb.andWhere('exchangeRate.effectiveAt <= :effectiveAt', { effectiveAt });
    }

    return qb
      .orderBy('exchangeRate.effectiveAt', 'DESC')
      .addOrderBy('exchangeRate.createdAt', 'DESC')
      .getOne();
  }

  async remove(rate: ExchangeRateEntity): Promise<void> {
    await this.repository.remove(rate);
  }
}
