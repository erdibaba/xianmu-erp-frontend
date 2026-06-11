<template>
  <div class="mod-erp-stock-adjustment">
    <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabChange">
      <el-tab-pane label="转仓库" name="WAREHOUSE_TRANSFER">
        <div class="adjust-tip">只调整库存所在仓库，不改变冷冻/冷鲜、生产日期和过期日期。</div>
        <adjustment-panel
          ref="warehousePanel"
          adjustment-type="WAREHOUSE_TRANSFER"
          :warehouse-list="warehouseList">
        </adjustment-panel>
      </el-tab-pane>
      <el-tab-pane label="冷鲜转冷冻" name="FRESH_TO_FROZEN">
        <div class="adjust-tip">只能选择当前非冷冻库存；生产日期不可改，转冷冻后需要重新填写过期日期。</div>
        <adjustment-panel
          ref="freshPanel"
          adjustment-type="FRESH_TO_FROZEN"
          :warehouse-list="warehouseList">
        </adjustment-panel>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
  const AdjustmentPanel = {
    name: 'AdjustmentPanel',
    props: {
      adjustmentType: {
        type: String,
        required: true
      },
      warehouseList: {
        type: Array,
        default: () => []
      }
    },
    data () {
      return {
        query: {
          keyword: '',
          warehouseName: '',
          containerNo: '',
          factoryNo: ''
        },
        dataList: [],
        selectedRows: [],
        loading: false
      }
    },
    computed: {
      isWarehouseTransfer () {
        return this.adjustmentType === 'WAREHOUSE_TRANSFER'
      }
    },
    activated () {
      this.getDataList()
    },
    methods: {
      getDataList () {
        this.loading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-adjustment/lots'),
          method: 'get',
          params: this.$http.adornParams(Object.assign({}, this.query, {
            adjustmentType: this.adjustmentType
          }))
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataList = (data.list || []).map(item => Object.assign({}, item, {
              transferBoxes: '',
              transferWeightKg: '',
              targetWarehouseId: '',
              targetWarehouseName: '',
              targetExpiryDate: this.isWarehouseTransfer ? item.expiryDate : ''
            }))
          } else {
            this.dataList = []
            this.$message.error((data && data.msg) || '获取库存明细失败')
          }
          this.loading = false
        }).catch(() => {
          this.loading = false
        })
      },
      resetQuery () {
        this.query = {
          keyword: '',
          warehouseName: '',
          containerNo: '',
          factoryNo: ''
        }
        this.getDataList()
      },
      selectionChangeHandle (rows) {
        this.selectedRows = rows || []
      },
      targetWarehouseChange (row) {
        const warehouse = this.warehouseList.find(item => String(item.id) === String(row.targetWarehouseId))
        row.targetWarehouseName = warehouse ? warehouse.warehouseName : ''
      },
      submitHandle () {
        if (!this.selectedRows.length) {
          this.$message.warning('请先勾选需要调整的库存明细')
          return
        }
        const message = this.validateRows()
        if (message) {
          this.$message.warning(message)
          return
        }
        const loading = this.$loading({
          lock: true,
          text: '正在确认库存调整...',
          spinner: 'el-icon-loading',
          background: 'rgba(255, 255, 255, 0.65)'
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-adjustment/save'),
          method: 'post',
          data: this.$http.adornData({
            adjustmentType: this.adjustmentType,
            itemList: this.selectedRows.map(row => ({
              sourceAdjustmentItemId: row.sourceAdjustmentItemId,
              sourceInboundOrderId: row.inboundOrderId,
              sourceInboundItemId: row.inboundItemId,
              sourcePackingItemId: row.packingItemId,
              sourceBatchId: row.batchId,
              productId: row.productId,
              targetWarehouseId: row.targetWarehouseId,
              targetWarehouseName: row.targetWarehouseName,
              targetExpiryDate: row.targetExpiryDate,
              transferBoxes: Number(row.transferBoxes),
              transferWeightKg: this.normalizeAmount(row.transferWeightKg)
            }))
          })
        }).then(({data}) => {
          loading.close()
          if (data && data.code === 0) {
            this.$message.success('库存调整已确认')
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '库存调整失败')
          }
        }).catch(() => {
          loading.close()
        })
      },
      validateRows () {
        for (let i = 0; i < this.selectedRows.length; i++) {
          const row = this.selectedRows[i]
          const rowNo = i + 1
          const boxes = Number(row.transferBoxes)
          const weight = Number(this.normalizeAmount(row.transferWeightKg))
          if (!boxes || boxes <= 0) return `第${rowNo}行调整箱数必须大于0`
          if (boxes > Number(row.availableBoxes || 0)) return `第${rowNo}行调整箱数不能大于可售箱数`
          if (!weight || weight <= 0) return `第${rowNo}行调整重量必须大于0`
          if (weight > Number(row.availableWeightKg || 0)) return `第${rowNo}行调整重量不能大于可售重量`
          if (this.isWarehouseTransfer) {
            if (!row.targetWarehouseId) return `第${rowNo}行请选择目标仓库`
            if (String(row.targetWarehouseId) === String(row.warehouseId)) return `第${rowNo}行目标仓库不能和原仓库相同`
          } else if (!row.targetExpiryDate) {
            return `第${rowNo}行请输入转冷冻后的过期日期`
          }
        }
        return ''
      },
      normalizeAmount (value) {
        if (value === null || value === undefined) return ''
        return String(value).replace(/,/g, '').trim()
      },
      formatDate (value) {
        if (!value) return ''
        const text = String(value)
        return text.length >= 10 ? text.substring(0, 10) : text
      }
    },
    template: `
      <div class="adjust-panel">
        <el-form :inline="true" :model="query" size="small">
          <el-form-item>
            <el-input v-model="query.keyword" placeholder="产品编码/中文名/英文名" clearable @keyup.enter.native="getDataList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.warehouseName" placeholder="仓库" clearable @keyup.enter.native="getDataList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.containerNo" placeholder="柜号" clearable @keyup.enter.native="getDataList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.factoryNo" placeholder="厂号" clearable @keyup.enter.native="getDataList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getDataList()">查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
            <el-button v-if="isAuth('erp:inventory-adjustment:save')" type="success" @click="submitHandle()">确认调整</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="dataList" border stripe height="620" v-loading="loading" @selection-change="selectionChangeHandle">
          <el-table-column type="selection" width="45" align="center" header-align="center"></el-table-column>
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="warehouseName" label="当前仓库" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="100" align="center" header-align="center"></el-table-column>
          <el-table-column prop="temperatureZone" label="冷冻/冷鲜" width="100" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productionDate" label="生产日期" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.productionDate) }}</template>
          </el-table-column>
          <el-table-column prop="expiryDate" label="当前过期日期" width="120" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.expiryDate) }}</template>
          </el-table-column>
          <el-table-column prop="availableBoxes" label="可售箱数" width="95" align="right" header-align="center"></el-table-column>
          <el-table-column prop="availableWeightKg" label="可售重量KG" width="115" align="right" header-align="center"></el-table-column>
          <el-table-column label="调整箱数" width="120" align="center" header-align="center">
            <template slot-scope="scope">
              <el-input-number v-model="scope.row.transferBoxes" :min="0" :precision="0" :controls="false" size="small" style="width: 96px;"></el-input-number>
            </template>
          </el-table-column>
          <el-table-column label="调整重量KG" width="130" align="center" header-align="center">
            <template slot-scope="scope">
              <el-input v-model="scope.row.transferWeightKg" size="small"></el-input>
            </template>
          </el-table-column>
          <el-table-column v-if="isWarehouseTransfer" label="目标仓库" min-width="170" align="center" header-align="center">
            <template slot-scope="scope">
              <el-select v-model="scope.row.targetWarehouseId" filterable clearable size="small" style="width: 150px;" @change="targetWarehouseChange(scope.row)">
                <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column v-else label="转冷冻后过期日期" width="170" align="center" header-align="center">
            <template slot-scope="scope">
              <el-date-picker v-model="scope.row.targetExpiryDate" type="date" value-format="yyyy-MM-dd" size="small" style="width: 145px;"></el-date-picker>
            </template>
          </el-table-column>
          <el-table-column prop="lotType" label="来源" width="90" align="center" header-align="center">
            <template slot-scope="scope">{{ scope.row.lotType === 'ADJUSTMENT' ? '调整后' : '入库' }}</template>
          </el-table-column>
        </el-table>
      </div>
    `
  }

  export default {
    components: {
      AdjustmentPanel
    },
    data () {
      return {
        activeTab: 'WAREHOUSE_TRANSFER',
        warehouseList: []
      }
    },
    activated () {
      this.loadWarehouses()
      this.$nextTick(() => {
        this.currentPanel() && this.currentPanel().getDataList()
      })
    },
    methods: {
      handleTabChange () {
        this.$nextTick(() => {
          this.currentPanel() && this.currentPanel().getDataList()
        })
      },
      currentPanel () {
        return this.activeTab === 'FRESH_TO_FROZEN' ? this.$refs.freshPanel : this.$refs.warehousePanel
      },
      loadWarehouses () {
        this.$http({
          url: this.$http.adornUrl('/erp/warehouse/select'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          this.warehouseList = (data && data.list) || []
        })
      }
    }
  }
</script>

<style scoped>
  .mod-erp-stock-adjustment .adjust-tip {
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid #d9ecff;
    border-radius: 4px;
    background: #ecf5ff;
    color: #3a6f9f;
    line-height: 1.5;
  }

  .adjust-panel .el-form {
    margin-bottom: 12px;
  }
</style>
