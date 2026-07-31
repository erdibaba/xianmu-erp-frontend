<template>
  <div class="mod-erp-inventory-cost">
    <el-alert
      title="成本价按当前剩余库存重量动态计算：订单确认函含税采购价 + 每日动态资金成本 + 每日动态仓储费 + 已登记支出费用。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" size="small" class="query-form">
      <el-form-item>
        <el-input v-model="queryForm.keyword" placeholder="产品编码/中文名/英文名" clearable @keyup.enter.native="queryDataList"></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.warehouseId" filterable clearable placeholder="请选择仓库" style="width: 190px;" @change="warehouseChange">
          <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select
          v-model="queryForm.containerNos"
          multiple
          filterable
          remote
          clearable
          reserve-keyword
          :disabled="!queryForm.warehouseId"
          :loading="containerLoading"
          :remote-method="remoteSearchContainers"
          placeholder="请选择柜号"
          style="width: 260px;">
          <el-option v-for="item in containerOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="queryForm.factoryNo" placeholder="厂号" clearable @keyup.enter.native="queryDataList"></el-input>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="queryForm.onlyAvailable" true-label="1" false-label="0">只看可售库存</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="queryDataList">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button type="success" :loading="exportLoading" @click="exportSuggestionTemplate">导出建议销售价模板</el-button>
        <el-upload
          class="suggestion-upload"
          action="#"
          :show-file-list="false"
          :http-request="importSuggestionFile"
          accept=".xlsx,.xls">
          <el-button type="warning" :loading="importLoading">导入建议销售价</el-button>
        </el-upload>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" height="640">
      <el-table-column type="index" :index="dataRowIndex" label="序号" width="60" align="center" header-align="center"></el-table-column>
      <el-table-column prop="productCode" label="产品编码" min-width="110" align="center" header-align="center"></el-table-column>
      <el-table-column prop="contractNo" label="确认函合同号" min-width="150" show-overflow-tooltip></el-table-column>
      <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="availableBoxes" label="可售箱数" width="100" align="right" header-align="center"></el-table-column>
      <el-table-column prop="availableWeightKg" label="可售重量(KG)" width="125" align="right" header-align="center">
        <template slot-scope="scope">{{ numberText(scope.row.availableWeightKg, 2) }}</template>
      </el-table-column>
      <el-table-column label="含税采购单价(元/KG)" width="165" align="right" header-align="center">
        <template slot-scope="scope">{{ numberText(scope.row.purchasePriceKg, 6) }}</template>
      </el-table-column>
      <el-table-column label="成本价(元/KG)" width="135" align="right" header-align="center">
        <template slot-scope="scope">
          <span class="cost-price">{{ numberText(scope.row.costPriceKg, 6) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="建议销售价(元/KG)" width="155" align="right" header-align="center">
        <template slot-scope="scope">{{ scope.row.suggestedSalePriceKg ? numberText(scope.row.suggestedSalePriceKg, 6) : '-' }}</template>
      </el-table-column>
      <el-table-column label="增长百分比" width="115" align="right" header-align="center">
        <template slot-scope="scope">{{ percentText(scope.row.suggestedMarkupPercent) }}</template>
      </el-table-column>
      <el-table-column label="采购成本" width="125" align="right" header-align="center">
        <template slot-scope="scope">{{ moneyText(scope.row.purchaseAmount) }}</template>
      </el-table-column>
      <el-table-column label="分摊费用" width="125" align="right" header-align="center">
        <template slot-scope="scope">{{ moneyText(scope.row.allocatedFeeAmount) }}</template>
      </el-table-column>
      <el-table-column label="成本总额" width="125" align="right" header-align="center">
        <template slot-scope="scope">{{ moneyText(scope.row.totalCostAmount) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" header-align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetailDialog(scope.row)">费用明细</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="inventory-cost-pagination"
      :current-page="pageIndex"
      :page-size="pageSize"
      :page-sizes="[20, 50, 100]"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="pageSizeChangeHandle"
      @current-change="currentPageChangeHandle">
    </el-pagination>

    <el-dialog
      title="成本费用明细"
      :visible.sync="detailDialogVisible"
      width="92vw"
      custom-class="inventory-cost-detail-dialog"
      @opened="layoutDetailTable"
      append-to-body>
      <div v-if="currentRow" class="detail-summary">
        <span>产品编码：{{ currentRow.productCode || '-' }}</span>
        <span>确认函合同号：{{ currentRow.contractNo || '-' }}</span>
        <span>产品名称：{{ currentRow.productName || '-' }}</span>
        <span>货权：{{ currentRow.ownershipName || '-' }}</span>
        <span>成本价：{{ numberText(currentRow.costPriceKg, 6) }} 元/KG</span>
      </div>
      <div v-if="currentRow" class="cost-formula-box">
        <div class="formula-title">成本价计算公式</div>
        <div class="formula-main">
          成本价 = 成本总额 ÷ 当前可售重量 =
          {{ moneyText(currentRow.totalCostAmount) }} ÷ {{ numberText(currentRow.availableWeightKg, 2) }} =
          {{ numberText(currentRow.costPriceKg, 6) }} 元/KG
        </div>
        <div class="formula-sub">
          成本总额 = 采购成本 + 分摊费用 =
          {{ moneyText(currentRow.purchaseAmount) }} + {{ moneyText(currentRow.allocatedFeeAmount) }} =
          {{ moneyText(currentRow.totalCostAmount) }}
        </div>
        <div v-if="feeSummaryText" class="formula-sub">
          分摊费用组成：{{ feeSummaryText }}
        </div>
      </div>
      <el-table ref="detailTable" :data="detailList" border stripe v-loading="detailLoading" height="430" :fit="false" class="inventory-cost-detail-table">
        <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
        <el-table-column prop="costType" label="费用类型" width="120" show-overflow-tooltip></el-table-column>
        <el-table-column prop="costName" label="费用名称" width="170" show-overflow-tooltip></el-table-column>
        <el-table-column prop="sourceNo" label="来源单号" width="170" show-overflow-tooltip></el-table-column>
        <el-table-column prop="contractNo" label="合同号" width="170" show-overflow-tooltip></el-table-column>
        <el-table-column prop="containerNo" label="柜号" width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="factoryNo" label="厂号" width="100" align="center" header-align="center"></el-table-column>
        <el-table-column label="生产日期" width="115" align="center" header-align="center">
          <template slot-scope="scope">{{ dateText(scope.row.productionDate) }}</template>
        </el-table-column>
        <el-table-column label="过期日期" width="115" align="center" header-align="center">
          <template slot-scope="scope">{{ dateText(scope.row.expiryDate) }}</template>
        </el-table-column>
        <el-table-column prop="availableBoxes" label="剩余箱数" width="95" align="right" header-align="center"></el-table-column>
        <el-table-column label="来源金额" width="125" align="right" header-align="center">
          <template slot-scope="scope">{{ moneyText(scope.row.sourceAmount) }}</template>
        </el-table-column>
        <el-table-column label="分摊金额" width="125" align="right" header-align="center">
          <template slot-scope="scope">{{ moneyText(scope.row.allocatedAmount) }}</template>
        </el-table-column>
        <el-table-column label="本行重量(KG)" width="125" align="right" header-align="center">
          <template slot-scope="scope">{{ numberText(scope.row.basisWeightKg, 2) }}</template>
        </el-table-column>
        <el-table-column label="合同剩余重量(KG)" width="145" align="right" header-align="center">
          <template slot-scope="scope">{{ numberText(scope.row.totalBasisWeightKg, 2) }}</template>
        </el-table-column>
        <el-table-column label="计算公式" width="420" show-overflow-tooltip>
          <template slot-scope="scope">{{ detailFormula(scope.row) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" width="320" show-overflow-tooltip></el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        warehouseList: [],
        containerOptions: [],
        containerLoading: false,
        queryForm: {
          keyword: '',
          warehouseId: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        },
        dataList: [],
        dataListLoading: false,
        pageIndex: 1,
        pageSize: 20,
        totalPage: 0,
        exportLoading: false,
        importLoading: false,
        detailDialogVisible: false,
        detailLoading: false,
        detailList: [],
        currentRow: null
      }
    },
    computed: {
      feeSummaryText () {
        const summary = {}
        ;(this.detailList || []).forEach(item => {
          if (item.costType === '采购成本') return
          const key = item.costType || '其他费用'
          summary[key] = (summary[key] || 0) + Number(item.allocatedAmount || 0)
        })
        return Object.keys(summary).map(key => `${key}${this.moneyText(summary[key])}`).join('，')
      }
    },
    activated () {
      this.loadWarehouses()
      this.getDataList()
    },
    methods: {
      queryDataList () {
        this.pageIndex = 1
        this.getDataList()
      },
      getDataList () {
        this.dataListLoading = true
        const params = Object.assign({}, this.queryForm, {
          containerNos: (this.queryForm.containerNos || []).join(','),
          page: this.pageIndex,
          limit: this.pageSize
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/spot'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            const page = data.page || {}
            this.dataList = page.list || []
            this.totalPage = Number(page.totalCount || 0)
            this.pageIndex = Number(page.currPage || this.pageIndex)
            this.pageSize = Number(page.pageSize || this.pageSize)
          } else {
            this.dataList = []
            this.totalPage = 0
            this.$message.error((data && data.msg) || '获取库存成本失败')
          }
        }).finally(() => {
          this.dataListLoading = false
        })
      },
      pageSizeChangeHandle (value) {
        this.pageSize = value
        this.pageIndex = 1
        this.getDataList()
      },
      currentPageChangeHandle (value) {
        this.pageIndex = value
        this.getDataList()
      },
      dataRowIndex (index) {
        return (this.pageIndex - 1) * this.pageSize + index + 1
      },
      openDetailDialog (row) {
        this.currentRow = row
        this.detailList = []
        this.detailDialogVisible = true
        this.detailLoading = true
        const params = Object.assign({}, this.queryForm, {
          productId: row.productId,
          confirmId: row.confirmId || '',
          contractNo: row.contractNo || '',
          ownershipName: row.ownershipName || '',
          containerNos: (this.queryForm.containerNos || []).join(',')
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/spot/details'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.detailList = data.list || []
            this.layoutDetailTable()
          } else {
            this.detailList = []
            this.$message.error((data && data.msg) || '获取成本明细失败')
          }
        }).finally(() => {
          this.detailLoading = false
          this.layoutDetailTable()
        })
      },
      layoutDetailTable () {
        this.$nextTick(() => {
          if (this.$refs.detailTable && this.$refs.detailTable.doLayout) {
            this.$refs.detailTable.doLayout()
          }
        })
      },
      resetQuery () {
        this.queryForm = {
          keyword: '',
          warehouseId: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        }
        this.pageIndex = 1
        this.containerOptions = []
        this.getDataList()
      },
      exportSuggestionTemplate () {
        this.exportLoading = true
        const params = Object.assign({}, this.queryForm, {
          containerNos: (this.queryForm.containerNos || []).join(',')
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/spot/export-suggestion-template'),
          method: 'get',
          params: this.$http.adornParams(params),
          responseType: 'blob'
        }).then(({data}) => {
          this.downloadBlob(data, '库存建议销售价导入模板.xlsx')
        }).catch(() => {
          this.$message.error('导出建议销售价模板失败')
        }).finally(() => {
          this.exportLoading = false
        })
      },
      importSuggestionFile (request) {
        this.importLoading = true
        const formData = new FormData()
        formData.append('file', request.file)
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/spot/import-suggestion'),
          method: 'post',
          data: formData
        }).then(({data}) => {
          if (data && data.code === 0) {
            const result = data.result || {}
            if (result.success) {
              this.$message.success(`导入成功：${result.successRows || 0} 行`)
              this.getDataList()
            } else {
              const errors = (result.errors || []).slice(0, 20).join('\n')
              this.$alert(errors || '导入校验未通过', '导入失败', { type: 'error' })
            }
          } else {
            this.$message.error((data && data.msg) || '导入建议销售价失败')
          }
        }).catch(() => {
          this.$message.error('导入建议销售价失败')
        }).finally(() => {
          this.importLoading = false
        })
      },
      downloadBlob (data, fileName) {
        const blob = data instanceof Blob ? data : new Blob([data])
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
      },
      loadWarehouses () {
        this.$http({
          url: this.$http.adornUrl('/erp/warehouse/select'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          this.warehouseList = (data && data.list) || []
        })
      },
      warehouseChange () {
        this.queryForm.containerNos = []
        this.containerOptions = []
        this.remoteSearchContainers('')
      },
      remoteSearchContainers (keyword) {
        if (!this.queryForm.warehouseId) {
          this.containerOptions = []
          return
        }
        this.containerLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/containers'),
          method: 'get',
          params: this.$http.adornParams({
            inventoryType: 'spot',
            warehouseId: this.queryForm.warehouseId,
            keyword: keyword || ''
          })
        }).then(({data}) => {
          const list = (data && data.list) || []
          const selected = this.queryForm.containerNos || []
          this.containerOptions = Array.from(new Set(selected.concat(list)))
        }).finally(() => {
          this.containerLoading = false
        })
      },
      moneyText (value) {
        return this.numberText(value, 2)
      },
      numberText (value, digits) {
        const num = Number(value || 0)
        return num.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
      },
      percentText (value) {
        if (value === undefined || value === null || value === '') return '-'
        return `${this.numberText(value, 2)}%`
      },
      dateText (value) {
        if (!value) return '-'
        return String(value).slice(0, 10)
      },
      detailFormula (row) {
        const costType = row.costType || ''
        if (costType === '采购成本') {
          return `采购成本 = 当前剩余重量${this.numberText(row.basisWeightKg, 2)}KG × 含税采购单价，计入${this.moneyText(row.allocatedAmount)}`
        }
        const totalBasis = Number(row.totalBasisWeightKg || 0)
        if (totalBasis > 0) {
          const ratio = Number(row.basisWeightKg || 0) / totalBasis * 100
          return `分摊比例 = 本行剩余重量${this.numberText(row.basisWeightKg, 2)}KG ÷ 合同剩余重量${this.numberText(row.totalBasisWeightKg, 2)}KG = ${this.percentText(ratio)}；分摊金额 = 来源金额${this.moneyText(row.sourceAmount)} × 分摊比例 = ${this.moneyText(row.allocatedAmount)}`
        }
        return `分摊金额 = ${this.moneyText(row.allocatedAmount)}`
      }
    }
  }
</script>

<style scoped>
  .mod-erp-inventory-cost .query-form {
    margin: 15px 0 12px;
  }

  .suggestion-upload {
    display: inline-block;
    margin-left: 10px;
    vertical-align: middle;
  }

  .inventory-cost-pagination {
    margin-top: 14px;
    text-align: right;
  }

  .cost-price {
    color: #0f8f83;
    font-weight: 600;
  }

  .detail-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin-bottom: 12px;
    padding: 10px 12px;
    background: #f6f8fa;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    color: #303133;
  }

  .cost-formula-box {
    margin-bottom: 12px;
    padding: 12px 14px;
    border: 1px solid #cdeee9;
    border-radius: 6px;
    background: #f0fbf9;
    color: #2c3e3b;
    line-height: 1.7;
  }

  .formula-title {
    margin-bottom: 4px;
    color: #0f8f83;
    font-weight: 700;
  }

  .formula-main {
    font-weight: 650;
  }

  .formula-sub {
    color: #5f6f6c;
  }

  /deep/ .inventory-cost-detail-dialog {
    max-width: 1480px;
  }
</style>
