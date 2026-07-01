<template>
  <div class="mod-contract-daily-cost">
    <el-alert
      title="按确认函合同号归档每天产生的资金利息、仓储费等成本。查询时会自动补齐缺失快照；如基础数据补录或调整，可点击重新生成覆盖当前日期范围。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" size="small" class="query-form">
      <el-form-item>
        <el-input v-model.trim="queryForm.contractNo" placeholder="确认函合同号" clearable @keyup.enter.native="searchHandle"></el-input>
      </el-form-item>
      <el-form-item>
        <el-date-picker
          v-model="queryDateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchHandle">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button
          v-if="isAuth('erp:contract-daily-cost:refresh')"
          type="warning"
          :loading="refreshLoading"
          @click="refreshHandle">
          重新生成
        </el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" height="640">
      <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
      <el-table-column prop="contract_no" label="确认函合同号" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="cost_date" label="成本日期" width="115" align="center" header-align="center">
        <template slot-scope="scope">{{ dateText(scope.row.cost_date) }}</template>
      </el-table-column>
      <el-table-column prop="funder_names" label="资方" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column label="资金利息" width="130" align="right" header-align="center">
        <template slot-scope="scope">{{ amountText(scope.row.interest_amount) }}</template>
      </el-table-column>
      <el-table-column label="仓储费" width="130" align="right" header-align="center">
        <template slot-scope="scope">{{ amountText(scope.row.storage_amount) }}</template>
      </el-table-column>
      <el-table-column label="其他费用" width="130" align="right" header-align="center">
        <template slot-scope="scope">{{ amountText(scope.row.other_amount) }}</template>
      </el-table-column>
      <el-table-column label="当日成本合计" width="145" align="right" header-align="center">
        <template slot-scope="scope">
          <span class="total-amount">{{ amountText(scope.row.total_amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="calculation_summary" label="汇总公式" min-width="300" show-overflow-tooltip></el-table-column>
      <el-table-column label="生成时间" width="160" align="center" header-align="center">
        <template slot-scope="scope">{{ datetimeText(scope.row.update_time || scope.row.create_time) }}</template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="110" align="center" header-align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetail(scope.row)">费用说明</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle">
    </el-pagination>

    <el-dialog
      title="费用计算说明"
      :visible.sync="detailVisible"
      width="92vw"
      custom-class="contract-daily-cost-detail-dialog"
      append-to-body
      @opened="layoutDetailTable">
      <div v-if="currentRow" class="detail-summary">
        <span>合同号：{{ currentRow.contract_no || '-' }}</span>
        <span>日期：{{ dateText(currentRow.cost_date) }}</span>
        <span>资金利息：{{ amountText(currentRow.interest_amount) }}</span>
        <span>仓储费：{{ amountText(currentRow.storage_amount) }}</span>
        <span>合计：{{ amountText(currentRow.total_amount) }}</span>
      </div>
      <el-table
        ref="detailTable"
        :data="detailList"
        border
        stripe
        :fit="false"
        height="460"
        v-loading="detailLoading">
        <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
        <el-table-column prop="cost_type" label="费用类型" width="120" show-overflow-tooltip></el-table-column>
        <el-table-column prop="cost_name" label="费用名称" width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="source_no" label="来源" width="220" show-overflow-tooltip></el-table-column>
        <el-table-column prop="related_name" label="关联对象" width="180" show-overflow-tooltip></el-table-column>
        <el-table-column label="计算基数" width="135" align="right" header-align="center">
          <template slot-scope="scope">{{ numberText(scope.row.basis_amount, 4) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="135" align="right" header-align="center">
          <template slot-scope="scope">{{ amountText(scope.row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="formula" label="计算公式" width="520" show-overflow-tooltip></el-table-column>
        <el-table-column prop="remark" label="说明" width="360" show-overflow-tooltip></el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
  export default {
    data () {
      const today = new Date()
      const year = today.getFullYear()
      const pad = value => {
        value = String(value)
        return value.length >= 2 ? value : `0${value}`
      }
      const month = pad(today.getMonth() + 1)
      const day = pad(today.getDate())
      return {
        queryForm: {
          contractNo: ''
        },
        queryDateRange: [`${year}-${month}-01`, `${year}-${month}-${day}`],
        dataList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false,
        refreshLoading: false,
        detailVisible: false,
        detailLoading: false,
        detailList: [],
        currentRow: null
      }
    },
    activated () {
      this.getDataList()
    },
    methods: {
      searchHandle () {
        this.pageIndex = 1
        this.getDataList()
      },
      getDataList () {
        this.dataListLoading = true
        const range = this.queryDateRange || []
        this.$http({
          url: this.$http.adornUrl('/erp/contract-daily-cost/list'),
          method: 'get',
          params: this.$http.adornParams({
            page: this.pageIndex,
            limit: this.pageSize,
            contractNo: this.queryForm.contractNo,
            dateStart: range[0] || '',
            dateEnd: range[1] || ''
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataList = data.page.list || []
            this.totalPage = data.page.totalCount || 0
          } else {
            this.dataList = []
            this.totalPage = 0
            this.$message.error((data && data.msg) || '获取合同成本日报失败')
          }
        }).finally(() => {
          this.dataListLoading = false
        })
      },
      refreshHandle () {
        const range = this.queryDateRange || []
        if (!range[0] || !range[1]) {
          this.$message.warning('请先选择日期范围')
          return
        }
        this.$confirm('重新生成会覆盖当前筛选范围内已有日报快照，确定继续吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.refreshLoading = true
          return this.$http({
            url: this.$http.adornUrl('/erp/contract-daily-cost/refresh'),
            method: 'post',
            params: this.$http.adornParams({
              contractNo: this.queryForm.contractNo,
              dateStart: range[0],
              dateEnd: range[1]
            })
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.$message.success('重新生成成功')
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '重新生成失败')
          }
        }).catch(() => {
        }).finally(() => {
          this.refreshLoading = false
        })
      },
      openDetail (row) {
        this.currentRow = row
        this.detailList = []
        this.detailVisible = true
        this.detailLoading = true
        this.$http({
          url: this.$http.adornUrl(`/erp/contract-daily-cost/details/${row.id}`),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.detailList = data.list || []
            this.layoutDetailTable()
          } else {
            this.$message.error((data && data.msg) || '获取费用说明失败')
          }
        }).finally(() => {
          this.detailLoading = false
          this.layoutDetailTable()
        })
      },
      resetQuery () {
        this.queryForm.contractNo = ''
        this.queryDateRange = []
        this.searchHandle()
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
      layoutDetailTable () {
        this.$nextTick(() => {
          if (this.$refs.detailTable && this.$refs.detailTable.doLayout) {
            this.$refs.detailTable.doLayout()
          }
        })
      },
      dateText (value) {
        return value ? String(value).slice(0, 10) : '-'
      },
      datetimeText (value) {
        return value ? String(value).replace('T', ' ').slice(0, 19) : '-'
      },
      amountText (value) {
        return this.numberText(value, 6)
      },
      numberText (value, digits) {
        const num = Number(value || 0)
        return num.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
      }
    }
  }
</script>

<style scoped>
  .mod-contract-daily-cost .query-form {
    margin: 15px 0 12px;
  }

  .mod-contract-daily-cost .el-pagination {
    margin-top: 15px;
    text-align: right;
  }

  .total-amount {
    color: #0f8f83;
    font-weight: 700;
  }

  .detail-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid #cdeee9;
    border-radius: 6px;
    background: #f0fbf9;
    color: #2c3e3b;
    font-weight: 650;
  }

  /deep/ .contract-daily-cost-detail-dialog {
    max-width: 1480px;
  }
</style>
