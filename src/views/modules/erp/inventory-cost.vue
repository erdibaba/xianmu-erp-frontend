<template>
  <div class="mod-erp-inventory-cost">
    <el-alert
      title="成本价按当前剩余库存重量动态计算：订单确认函采购价 + 每日动态资金成本 + 每日动态仓储费 + 已登记支出费用。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" size="small" class="query-form">
      <el-form-item>
        <el-input v-model="queryForm.keyword" placeholder="产品编码/中文名/英文名" clearable @keyup.enter.native="getDataList"></el-input>
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
        <el-input v-model="queryForm.factoryNo" placeholder="厂号" clearable @keyup.enter.native="getDataList"></el-input>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="queryForm.onlyAvailable" true-label="1" false-label="0">只看可售库存</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" height="640">
      <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
      <el-table-column prop="productCode" label="产品编码" min-width="110" align="center" header-align="center"></el-table-column>
      <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="availableBoxes" label="可售箱数" width="100" align="right" header-align="center"></el-table-column>
      <el-table-column prop="availableWeightKg" label="可售重量(KG)" width="125" align="right" header-align="center">
        <template slot-scope="scope">{{ numberText(scope.row.availableWeightKg, 2) }}</template>
      </el-table-column>
      <el-table-column label="采购单价(元/KG)" width="145" align="right" header-align="center">
        <template slot-scope="scope">{{ numberText(scope.row.purchasePriceKg, 6) }}</template>
      </el-table-column>
      <el-table-column label="成本价(元/KG)" width="135" align="right" header-align="center">
        <template slot-scope="scope">
          <span class="cost-price">{{ numberText(scope.row.costPriceKg, 6) }}</span>
        </template>
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

    <el-dialog
      title="成本费用明细"
      :visible.sync="detailDialogVisible"
      width="92vw"
      custom-class="inventory-cost-detail-dialog"
      append-to-body>
      <div v-if="currentRow" class="detail-summary">
        <span>产品编码：{{ currentRow.productCode || '-' }}</span>
        <span>产品名称：{{ currentRow.productName || '-' }}</span>
        <span>货权：{{ currentRow.ownershipName || '-' }}</span>
        <span>成本价：{{ numberText(currentRow.costPriceKg, 6) }} 元/KG</span>
      </div>
      <el-table :data="detailList" border stripe v-loading="detailLoading" height="430">
        <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
        <el-table-column prop="costType" label="费用类型" width="120" show-overflow-tooltip></el-table-column>
        <el-table-column prop="costName" label="费用名称" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="sourceNo" label="来源单号" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="contractNo" label="合同号" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
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
        <el-table-column prop="remark" label="说明" min-width="260" show-overflow-tooltip></el-table-column>
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
        detailDialogVisible: false,
        detailLoading: false,
        detailList: [],
        currentRow: null
      }
    },
    activated () {
      this.loadWarehouses()
      this.getDataList()
    },
    methods: {
      getDataList () {
        this.dataListLoading = true
        const params = Object.assign({}, this.queryForm, {
          containerNos: (this.queryForm.containerNos || []).join(',')
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/spot'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataList = data.list || []
          } else {
            this.dataList = []
            this.$message.error((data && data.msg) || '获取库存成本失败')
          }
        }).finally(() => {
          this.dataListLoading = false
        })
      },
      openDetailDialog (row) {
        this.currentRow = row
        this.detailList = []
        this.detailDialogVisible = true
        this.detailLoading = true
        const params = Object.assign({}, this.queryForm, {
          productId: row.productId,
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
          } else {
            this.detailList = []
            this.$message.error((data && data.msg) || '获取成本明细失败')
          }
        }).finally(() => {
          this.detailLoading = false
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
        this.containerOptions = []
        this.getDataList()
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
      dateText (value) {
        if (!value) return '-'
        return String(value).slice(0, 10)
      }
    }
  }
</script>

<style scoped>
  .mod-erp-inventory-cost .query-form {
    margin: 15px 0 12px;
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

  /deep/ .inventory-cost-detail-dialog {
    max-width: 1480px;
  }
</style>
