import prisma from "../../utils/prisma";

export class DashboardService {
  /**
   * Get overall financial summary:
   * total income, total expenses, net balance, record count
   */
  async getSummary() {
    const [incomeResult, expenseResult, totalCount] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { type: "INCOME", deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.aggregate({
        where: { type: "EXPENSE", deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.count({
        where: { deletedAt: null },
      }),
    ]);

    const totalIncome = incomeResult._sum.amount || 0;
    const totalExpenses = expenseResult._sum.amount || 0;
    const netBalance = totalIncome - totalExpenses;

    return {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netBalance: parseFloat(netBalance.toFixed(2)),
      totalRecords: totalCount,
      incomeCount: incomeResult._count,
      expenseCount: expenseResult._count,
    };
  }

  /**
   * Get totals grouped by category
   */
  async getCategoryTotals() {
    const results = await prisma.financialRecord.groupBy({
      by: ["category", "type"],
      where: { deletedAt: null },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    });

    // Group results by type for cleaner output
    const income: Array<{ category: string; total: number; count: number }> = [];
    const expense: Array<{ category: string; total: number; count: number }> = [];

    for (const result of results) {
      const item = {
        category: result.category,
        total: parseFloat((result._sum.amount || 0).toFixed(2)),
        count: result._count,
      };

      if (result.type === "INCOME") {
        income.push(item);
      } else {
        expense.push(item);
      }
    }

    return { income, expense };
  }

  /**
   * Get monthly trends for the last 12 months
   */
  async getTrends() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // Use raw SQL for monthly aggregation since Prisma groupBy doesn't support date truncation
    const trends = await prisma.$queryRaw<
      Array<{
        month: Date;
        type: string;
        total: number;
        count: bigint;
      }>
    >`
      SELECT
        DATE_TRUNC('month', date) as month,
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM financial_records
      WHERE deleted_at IS NULL
        AND date >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', date), type
      ORDER BY month ASC
    `;

    // Transform into a month-by-month format
    const monthlyData = new Map<
      string,
      { month: string; income: number; expenses: number; net: number; incomeCount: number; expenseCount: number }
    >();

    for (const row of trends) {
      const monthKey = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = new Date(row.month).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthLabel,
          income: 0,
          expenses: 0,
          net: 0,
          incomeCount: 0,
          expenseCount: 0,
        });
      }

      const entry = monthlyData.get(monthKey)!;
      const total = parseFloat(Number(row.total).toFixed(2));
      const count = Number(row.count);

      if (row.type === "INCOME") {
        entry.income = total;
        entry.incomeCount = count;
      } else {
        entry.expenses = total;
        entry.expenseCount = count;
      }
      entry.net = parseFloat((entry.income - entry.expenses).toFixed(2));
    }

    return Array.from(monthlyData.values());
  }

  /**
   * Get recent financial activity (last 10 records)
   */
  async getRecentActivity(limit: number = 10) {
    const records = await prisma.financialRecord.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return records;
  }
}

export const dashboardService = new DashboardService();
