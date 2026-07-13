<template>
  <el-dialog
    title="期货入库后实际库存分配"
    :visible.sync="visible"
    :close-on-click-modal="false"
    width="94%"
    top="4vh"
    append-to-body>
    <div v-loading="loading || saving" class="futures-allocation-dialog">
      <el-alert
        title="按原期货销售产品分配已入库库存；每个产品的已选箱数必须等于应分配箱数。跳过更早确认函库存时，将进入货物风控审核。"
        type="info"
        :closable="false"
        show-icon>
      </el-alert>

      <div class="section-title">期货销售产品</div>
      <el-table :data="productList" border size="mini">
        <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
        <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="180"></el-table-column>
        <el-table-column prop="boxes" label="应分配箱数" width="110" align="right"></el-table-column>
        <el-table-column label="已选箱数" width="110" align="right">
          <template slot-scope="scope">
            <span :class="{ 'count-error': selectedBoxes(scope.row.productId) !== Number(scope.row.boxes || 0) }">
              {{ selectedBoxes(scope.row.productId) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="contractQuantityKg" label="销售重量KG" width="120" align="right"></el-table-column>
        <el-table-column prop="salePriceKg" label="销售价（元/KG）" width="135" align="right"></el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope"><el-button type="text" size="small" @click="queryProductStock(scope.row)">选择库存</el-button></template>
        </el-table-column>
      </el-table>

      <div class="stock-toolbar">
        <el-select v-model="productId" placeholder="选择期货单产品" style="width:420px;" @change="querySelectedProduct">
          <el-option v-for="item in productList" :key="item.productId" :label="`${item.productCode} / ${item.marketCirculationName || item.productName || '-'}`" :value="item.productId"></el-option>
        </el-select>
        <el-button type="primary" :disabled="!productId" @click="querySelectedProduct">查询可售库存</el-button>
        <el-button type="success" plain :disabled="pendingCount === 0" @click="addCheckedLots">加入分配明细（{{ pendingCount }}）</el-button>
      </div>

      <el-table :data="contractList" border size="mini" row-key="_rowKey" class="contract-table">
        <el-table-column type="expand" width="48">
          <template slot-scope="scope">
            <el-table
              :ref="`futuresLots_${scope.row._rowKey}`"
              :data="scope.row.lotList || []"
              border
              size="mini"
              row-key="_sourceKey"
              @selection-change="selection => lotSelectionChange(scope.row, selection)">
              <el-table-column type="selection" width="48" :selectable="lotSelectable"></el-table-column>
              <el-table-column prop="warehouseName" label="仓库" min-width="140"></el-table-column>
              <el-table-column prop="ownershipName" label="货权" min-width="130"></el-table-column>
              <el-table-column prop="factoryNo" label="厂号" width="100"></el-table-column>
              <el-table-column label="生产日期" width="115"><template slot-scope="lotScope">{{ dateOnly(lotScope.row.productionDate) }}</template></el-table-column>
              <el-table-column label="过期日期" width="150">
                <template slot-scope="lotScope"><span :class="{ expired: Number(lotScope.row.expired || 0) === 1 }">{{ dateOnly(lotScope.row.expiryDate) }}</span><el-tag v-if="Number(lotScope.row.expired || 0) === 1" type="danger" size="mini">已过期</el-tag></template>
              </el-table-column>
              <el-table-column prop="availableBoxes" label="可售箱数" width="95" align="right"></el-table-column>
              <el-table-column prop="availableWeightKg" label="可售重量KG" width="120" align="right"></el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="150"></el-table-column>
        <el-table-column label="预计到港" width="115"><template slot-scope="scope">{{ dateOnly(scope.row.expectedArrivalDate) }}</template></el-table-column>
        <el-table-column prop="productCode" label="产品编码" width="110"></el-table-column>
        <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="180"></el-table-column>
        <el-table-column prop="containerNo" label="柜号" min-width="130"></el-table-column>
        <el-table-column prop="warehouseNames" label="仓库" min-width="140"></el-table-column>
        <el-table-column prop="ownershipNames" label="货权" min-width="130"></el-table-column>
        <el-table-column prop="availableBoxes" label="可售箱数" width="95" align="right"></el-table-column>
      </el-table>

      <div class="section-title">已选实际库存</div>
      <el-table :data="allocationList" border size="mini" class="selected-table">
        <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
        <el-table-column prop="productCode" label="产品编码" width="110"></el-table-column>
        <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="170"></el-table-column>
        <el-table-column label="分配箱数" width="110"><template slot-scope="scope"><el-input-number v-model="scope.row.boxes" :controls="false" :min="1" :max="scope.row.availableBoxes" :precision="0" size="mini" style="width:100%;"></el-input-number></template></el-table-column>
        <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="145"></el-table-column>
        <el-table-column prop="sourceContainerNo" label="柜号" min-width="125"></el-table-column>
        <el-table-column prop="warehouseName" label="仓库" min-width="135"></el-table-column>
        <el-table-column prop="ownershipName" label="货权" min-width="125"></el-table-column>
        <el-table-column prop="contractFactoryNo" label="厂号" width="95"></el-table-column>
        <el-table-column label="生产日期" width="115"><template slot-scope="scope">{{ dateOnly(scope.row.productionDate) }}</template></el-table-column>
        <el-table-column label="过期日期" width="115"><template slot-scope="scope"><span :class="{ expired: Number(scope.row.expired || 0) === 1 }">{{ dateOnly(scope.row.expiryDate) }}</span></template></el-table-column>
        <el-table-column label="操作" width="70" fixed="right"><template slot-scope="scope"><el-button type="text" size="small" @click="allocationList.splice(scope.$index, 1)">移除</el-button></template></el-table-column>
      </el-table>
    </div>
    <span slot="footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">提交实际库存分配</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  data () {
    return {
      visible: false,
      loading: false,
      saving: false,
      order: {},
      productId: '',
      productList: [],
      contractList: [],
      allocationList: []
    }
  },
  computed: {
    pendingCount () {
      return this.contractList.reduce((total, row) => total + (row._selectedLots || []).length, 0)
    }
  },
  methods: {
    init (id) {
      this.visible = true
      this.loading = true
      this.order = {}
      this.productId = ''
      this.productList = []
      this.contractList = []
      this.allocationList = []
      this.$http({ url: this.$http.adornUrl(`/erp/saleorder/info/${id}`), method: 'get', params: this.$http.adornParams() }).then(({ data }) => {
        if (!data || data.code !== 0) throw new Error((data && data.msg) || '加载销售单失败')
        this.order = data.saleOrder || {}
        const grouped = {}
        ;(this.order.itemList || []).forEach(item => {
          const key = String(item.productId)
          if (!grouped[key]) grouped[key] = Object.assign({}, item, { boxes: 0, contractQuantityKg: 0 })
          grouped[key].boxes += Number(item.boxes || 0)
          grouped[key].contractQuantityKg += Number(item.contractQuantityKg || 0)
        })
        this.productList = Object.keys(grouped).map(key => grouped[key])
        this.loading = false
      }).catch(error => {
        this.loading = false
        this.$message.error(error.message || '加载销售单失败')
      })
    },
    sourceKey (item) {
      const value = field => item[field] === null || item[field] === undefined || item[field] === '' ? 0 : item[field]
      return `${value('productId')}:${value('sourceInboundItemId')}:${value('sourcePackingBatchId')}:${value('sourceAdjustmentItemId')}`
    },
    queryProductStock (product) {
      this.productId = product.productId
      this.querySelectedProduct()
    },
    querySelectedProduct () {
      if (!this.productId) return
      this.loading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/spot-stock/contracts'),
        method: 'get',
        params: this.$http.adornParams({ productId: this.productId, excludeOrderId: this.order.id })
      }).then(({ data }) => {
        this.contractList = ((data && data.list) || []).map((contract, index) => Object.assign({}, contract, {
          _rowKey: `${contract.confirmId || contract.confirmContractNo || index}:${contract.productId}`,
          _selectedLots: [],
          lotList: (contract.lotList || []).map(lot => Object.assign({}, lot, { _sourceKey: this.sourceKey(lot) }))
        }))
        if (!this.contractList.length) this.$message.warning('该产品暂无可售库存，请确认对应货物已经完成入库')
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    lotSelectionChange (contract, selection) {
      this.$set(contract, '_selectedLots', selection || [])
    },
    lotSelectable (lot) {
      const key = lot._sourceKey || this.sourceKey(lot)
      return !this.allocationList.some(item => (item._sourceKey || this.sourceKey(item)) === key)
    },
    addCheckedLots () {
      this.contractList.forEach(contract => {
        ;(contract._selectedLots || []).forEach(lot => {
          const key = lot._sourceKey || this.sourceKey(lot)
          if (this.allocationList.some(item => (item._sourceKey || this.sourceKey(item)) === key)) return
          this.allocationList.push(Object.assign({}, lot, {
            boxes: 1,
            availableBoxes: Number(lot.availableBoxes || 0),
            contractFactoryNo: lot.factoryNo || '',
            contractPortCold: lot.warehouseName || '',
            _sourceKey: key
          }))
        })
        contract._selectedLots = []
        const ref = this.$refs[`futuresLots_${contract._rowKey}`]
        const table = Array.isArray(ref) ? ref[0] : ref
        if (table) table.clearSelection()
      })
    },
    selectedBoxes (productId) {
      return this.allocationList.filter(item => String(item.productId) === String(productId)).reduce((sum, item) => sum + Number(item.boxes || 0), 0)
    },
    dateOnly (value) {
      if (!value) return '-'
      return String(value).substring(0, 10)
    },
    submit () {
      if (!this.allocationList.length) {
        this.$message.error('请先选择实际库存')
        return
      }
      const mismatch = this.productList.find(item => this.selectedBoxes(item.productId) !== Number(item.boxes || 0))
      if (mismatch) {
        this.$message.error(`产品${mismatch.productCode}应分配${mismatch.boxes}箱，当前已选${this.selectedBoxes(mismatch.productId)}箱`)
        return
      }
      this.saving = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/futures-allocation/submit'),
        method: 'post',
        data: this.$http.adornData({ id: this.order.id, allocationItemList: this.allocationList })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const result = data.saleOrder || {}
          this.$message.success(result.riskStatus === 'PENDING' ? '分配已提交，等待货物风控审核' : '实际库存分配完成')
          this.visible = false
          this.$emit('refreshDataList')
        } else {
          this.$message.error((data && data.msg) || '提交实际库存分配失败')
        }
        this.saving = false
      }).catch(() => { this.saving = false })
    }
  }
}
</script>

<style scoped>
.futures-allocation-dialog { min-height: 560px; max-height: calc(100vh - 190px); overflow-y: auto; padding-right: 6px; }
.section-title { margin: 14px 0 8px; padding-left: 8px; border-left: 3px solid #1f6fbf; font-weight: 600; }
.stock-toolbar { display: flex; align-items: center; gap: 10px; margin: 14px 0 10px; padding: 12px; border: 1px solid #dbe7f3; border-radius: 6px; background: linear-gradient(135deg, #f7fbff, #f2faf8); }
.contract-table /deep/ .el-table__expanded-cell { padding: 12px 16px; background: #f8fafc; }
.selected-table /deep/ .el-table__body-wrapper { max-height: 260px; overflow-y: auto; }
.count-error, .expired { color: #e23b3b; font-weight: 600; }
.expired { margin-right: 6px; }
</style>
