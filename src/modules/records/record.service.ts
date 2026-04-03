import prisma from "../../utils/prisma";
import { ApiError } from "../../utils/apiError";
import { RecordType, Prisma } from "../../generated/prisma/client";

interface ListRecordsFilters {
  type?: RecordType;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

export class RecordService {
  /**
   * Create a new financial record
   */
  async createRecord(data: {
    amount: number;
    type: RecordType;
    category: string;
    description?: string;
    date: string;
    userId: string;
  }) {
    const record = await prisma.financialRecord.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        date: new Date(data.date),
        userId: data.userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return record;
  }

  /**
   * List financial records with filtering, sorting, and pagination
   */
  async listRecords(filters: ListRecordsFilters) {
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sortBy = "date",
      order = "desc",
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause dynamically
    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null, // Exclude soft-deleted records
    };

    if (type) where.type = type;
    if (category) where.category = { contains: category, mode: "insensitive" };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }

    // Validate sortBy field
    const allowedSortFields = ["date", "amount", "category", "type", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortField]: order },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single record by ID
   */
  async getRecordById(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!record) {
      throw ApiError.notFound("Financial record not found");
    }

    return record;
  }

  /**
   * Update a financial record
   */
  async updateRecord(
    id: string,
    data: {
      amount?: number;
      type?: RecordType;
      category?: string;
      description?: string;
      date?: string;
    }
  ) {
    const existing = await prisma.financialRecord.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw ApiError.notFound("Financial record not found");
    }

    const updateData: Prisma.FinancialRecordUpdateInput = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type) updateData.type = data.type;
    if (data.category) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date) updateData.date = new Date(data.date);

    const record = await prisma.financialRecord.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return record;
  }

  /**
   * Soft delete a financial record
   */
  async deleteRecord(id: string) {
    const existing = await prisma.financialRecord.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw ApiError.notFound("Financial record not found");
    }

    await prisma.financialRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: "Record deleted successfully" };
  }
}

export const recordService = new RecordService();
