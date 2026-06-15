<template>
  <div class="mod-erp-expense">
    <el-alert
      title="支出费用由系统自动生成：入库完成生成入库装卸费，出库批次确认生成出库冷库费。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" style="margin-top: 15px;">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          placeholder="费用编号/合同号/销售单号/二批商/仓库"
          clearable
          @keyup.enter.native="getDataList()">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.expenseType" clearable placeholder="费用类型" style="width: 170px;">
          <el-option label="入库装卸费" value="INBOUND_HANDLING"></el-option>
          <el-option label="出库冷库费" value="OUTBOUND_STORAGE"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="dataList"
      border
      stripe
      v-loading="dataListLoading"
      style="margin-top: 15px;">
      <el-table-column prop="expenseNo" label="费用编号" min-width="190" show-overflow-tooltip></el-table-column>
      <el-table-column label="费用类型" width="120" align="center">
        <template slot-scope="scope">{{ expenseTypeLabel(scope.row.expenseType) }}</template>
      </el-table-column>
      <el-table-column prop="expenseName" label="费用名称" width="120"></el-table-column>
      <el-table-column prop="contractNo" label="合同号" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="saleOrderNo" label="销售单号" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="partnerName" label="二批商" min-width="160" show-overflow-tooltip></el-table-column>
      <el-table-column prop="warehouseName" label="仓库" min-width="160" show-overflow-tooltip></el-table-column>
      <el-table-column prop="temperatureZone" label="温区" width="90" align="center"></el-table-column>
      <el-table-column label="计费期间" min-width="190">
        <template slot-scope="scope">{{ dateText(scope.row.businessStartDate) }} 至 {{ dateText(scope.row.businessEndDate) }}</template>
      </el-table-column>
      <el-table-column prop="freeDays" label="免费天数" width="90" align="right" header-align="center"></el-table-column>
      <el-table-column prop="chargeDays" label="计费天数" width="90" align="right" header-align="center"></el-table-column>
      <el-table-column label="重量(吨)" width="110" align="right" header-align="center">
        <template slot-scope="scope">{{ numberText(scope.row.weightTon, 3) }}</template>
      </el-table-column>
      <el-table-column label="费率" width="110" align="right" header-align="center">
        <template slot-scope="scope">{{ numberText(scope.row.rate, 2) }}</template>
      </el-table-column>
      <el-table-column label="费用金额" width="120" align="right" header-align="center">
        <template slot-scope="scope">{{ moneyText(scope.row.totalAmount) }}</template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="240" show-overflow-tooltip></el-table-column>
    </el-table>

    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>
  </div>
</template>

<script>
export default {
  data () {
    return {
      queryForm: {
        keyword: '',
        expenseType: ''
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/expense/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          keyword: this.queryForm.keyword,
          expenseType: this.queryForm.expenseType
        })
      }).then(({data}) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list || []
          this.totalPage = data.page.totalCount || 0
        } else {
          this.dataList = []
          this.totalPage = 0
          this.$message.error((data && data.msg) || '获取支出费用失败')
        }
        this.dataListLoading = false
      }).catch(() => {
        this.dataListLoading = false
        this.$message.error('获取支出费用失败')
      })
    },
    resetQuery () {
      this.queryForm.keyword = ''
      this.queryForm.expenseType = ''
      this.pageIndex = 1
      this.getDataList()
    },
    sizeChangeHandle (val) {
      this.pageSize = val
      this.pageIndex = 1
      this.getDataList()
    },
    currentChangeHandle (val) {
      this.pageIndex = val
      this.getDataList()
    },
    expenseTypeLabel (type) {
      if (type === 'INBOUND_HANDLING') return '入库装卸费'
      if (type === 'OUTBOUND_STORAGE') return '出库冷库费'
      return type || '-'
    },
    dateText (value) {
      if (!value) return '-'
      return String(value).substring(0, 10)
    },
    numberText (value, precision) {
      const num = Number(value || 0)
      return num.toFixed(precision)
    },
    moneyText (value) {
      const num = Number(value || 0)
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  }
}
</script>
