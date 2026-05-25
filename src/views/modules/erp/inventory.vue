<template>
  <div class="mod-erp-inventory">
    <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabChange">
      <el-tab-pane label="现货库存" name="spot">
        <el-form :inline="true" :model="spotQuery" size="small">
          <el-form-item>
            <el-input v-model="spotQuery.keyword" placeholder="产品编码/中文名/英文名" clearable @keyup.enter.native="getSpotList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="spotQuery.warehouseName" placeholder="仓库" clearable @keyup.enter.native="getSpotList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="spotQuery.containerNo" placeholder="柜号" clearable @keyup.enter.native="getSpotList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="spotQuery.onlyAvailable" true-label="1" false-label="0">只看可售库存</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getSpotList()">查询</el-button>
            <el-button @click="resetSpotQuery()">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="spotList" border stripe v-loading="spotLoading" height="620">
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column prop="warehouseName" label="仓库" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="contractNo" label="合同号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="availableBoxes" label="可售箱数" width="100" align="right" header-align="center">
            <template slot-scope="scope">
              <span :class="{ 'inventory-danger': Number(scope.row.availableBoxes) < 0 }">{{ scope.row.availableBoxes }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="allocatedBoxes" label="已占用箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="damageWeightKg" label="报损重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="specWeight" label="规格/KG" width="100" align="right" header-align="center"></el-table-column>
          <el-table-column prop="availableWeightKg" label="可用重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="temperatureZone" label="温区" width="90" align="center" header-align="center"></el-table-column>
          <el-table-column label="预警" width="90" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" header-align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openBatchDialog('spot', scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="期货库存" name="futures">
        <el-form :inline="true" :model="futuresQuery" size="small">
          <el-form-item>
            <el-input v-model="futuresQuery.keyword" placeholder="产品编码/中文名/英文名" clearable @keyup.enter.native="getFuturesList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="futuresQuery.contractNo" placeholder="合同号" clearable @keyup.enter.native="getFuturesList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="futuresQuery.containerNo" placeholder="柜号" clearable @keyup.enter.native="getFuturesList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="futuresQuery.onlyAvailable" true-label="1" false-label="0">只看期货可售</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getFuturesList()">查询</el-button>
            <el-button @click="resetFuturesQuery()">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="futuresList" border stripe v-loading="futuresLoading" height="620">
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column prop="transferStatus" label="转现货状态" width="110" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag :type="getTransferTagType(scope.row.transferStatus)" size="small">{{ scope.row.transferStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="contractNo" label="合同号" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="customerReference" label="采购方" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="brandName" label="品牌方" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="futuresBoxes" label="期货总箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="futuresSoldBoxes" label="已占用箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="futuresAvailableBoxes" label="期货可售" width="100" align="right" header-align="center">
            <template slot-scope="scope">
              <span :class="{ 'inventory-danger': Number(scope.row.futuresAvailableBoxes) < 0 }">{{ scope.row.futuresAvailableBoxes }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalWeightKg" label="装箱重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="expectedArrivalDate" label="预计到港" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.expectedArrivalDate) }}</template>
          </el-table-column>
          <el-table-column label="预警" width="90" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" header-align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openBatchDialog('futures', scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="出入库记录" name="records">
        <el-form :inline="true" :model="recordQuery" size="small">
          <el-form-item>
            <el-input v-model="recordQuery.keyword" placeholder="产品/单号/客户" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.recordType" clearable placeholder="记录类型" style="width: 120px;">
              <el-option label="入库" value="INBOUND"></el-option>
              <el-option label="出库" value="OUTBOUND"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="recordQuery.contractNo" placeholder="合同号" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="recordQuery.warehouseName" placeholder="仓库" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="recordQuery.containerNo" placeholder="柜号" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getRecordList()">查询</el-button>
            <el-button @click="resetRecordQuery()">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="recordList" border stripe v-loading="recordLoading" height="620">
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column label="类型" width="90" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.recordType === 'INBOUND' ? 'success' : 'warning'" size="small">{{ scope.row.recordTypeName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="bizDate" label="日期" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.bizDate) }}</template>
          </el-table-column>
          <el-table-column prop="orderNo" label="单号" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="contractNo" label="合同号" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="customerName" label="客户" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="warehouseName" label="仓库" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="boxes" label="箱数" width="90" align="right" header-align="center"></el-table-column>
          <el-table-column prop="weightKg" label="重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80" align="center" header-align="center"></el-table-column>
          <el-table-column prop="sourceRemark" label="来源" width="100" align="center" header-align="center"></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      :title="batchDialogTitle"
      :visible.sync="batchDialogVisible"
      width="760px"
      append-to-body>
      <div v-if="currentInventoryRow" class="batch-summary">
        <span>合同号：{{ currentInventoryRow.contractNo || '-' }}</span>
        <span>柜号：{{ currentInventoryRow.containerNo || '-' }}</span>
        <span>产品编码：{{ currentInventoryRow.productCode || '-' }}</span>
        <span>产品名称：{{ currentInventoryRow.productName || '-' }}</span>
      </div>
      <el-table :data="batchList" border stripe v-loading="batchLoading" height="360">
        <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
        <el-table-column prop="productionDate" label="生产日期" width="130" align="center" header-align="center">
          <template slot-scope="scope">{{ formatDate(scope.row.productionDate) }}</template>
        </el-table-column>
        <el-table-column prop="expiryDate" label="过期日期" width="130" align="center" header-align="center">
          <template slot-scope="scope">{{ formatDate(scope.row.expiryDate) }}</template>
        </el-table-column>
        <el-table-column prop="boxes" label="箱数" width="100" align="right" header-align="center"></el-table-column>
        <el-table-column prop="weightKg" label="重量(KG)" width="120" align="right" header-align="center"></el-table-column>
        <el-table-column prop="shelfLifeDays" label="保质期天数" width="110" align="right" header-align="center"></el-table-column>
        <el-table-column label="预警" min-width="100" align="center" header-align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        activeTab: 'spot',
        spotQuery: {
          keyword: '',
          warehouseName: '',
          containerNo: '',
          onlyAvailable: '1'
        },
        futuresQuery: {
          keyword: '',
          contractNo: '',
          containerNo: '',
          onlyAvailable: '0'
        },
        recordQuery: {
          keyword: '',
          recordType: '',
          contractNo: '',
          warehouseName: '',
          containerNo: ''
        },
        spotList: [],
        futuresList: [],
        recordList: [],
        batchList: [],
        spotLoading: false,
        futuresLoading: false,
        recordLoading: false,
        batchLoading: false,
        batchDialogVisible: false,
        batchDialogTitle: '库存批次详情',
        currentInventoryRow: null
      }
    },
    activated () {
      this.getDataList()
    },
    methods: {
      handleTabChange () {
        this.getDataList()
      },
      getDataList () {
        if (this.activeTab === 'futures') {
          this.getFuturesList()
        } else if (this.activeTab === 'records') {
          this.getRecordList()
        } else {
          this.getSpotList()
        }
      },
      getSpotList () {
        this.spotLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/spot'),
          method: 'get',
          params: this.$http.adornParams(this.spotQuery)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.spotList = data.list || []
          } else {
            this.spotList = []
            this.$message.error((data && data.msg) || '获取现货库存失败')
          }
          this.spotLoading = false
        }).catch(() => {
          this.spotLoading = false
        })
      },
      getFuturesList () {
        this.futuresLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/futures'),
          method: 'get',
          params: this.$http.adornParams(this.futuresQuery)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.futuresList = data.list || []
          } else {
            this.futuresList = []
            this.$message.error((data && data.msg) || '获取期货库存失败')
          }
          this.futuresLoading = false
        }).catch(() => {
          this.futuresLoading = false
        })
      },
      getRecordList () {
        this.recordLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/records'),
          method: 'get',
          params: this.$http.adornParams(this.recordQuery)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.recordList = data.list || []
          } else {
            this.recordList = []
            this.$message.error((data && data.msg) || '获取出入库记录失败')
          }
          this.recordLoading = false
        }).catch(() => {
          this.recordLoading = false
        })
      },
      openBatchDialog (type, row) {
        this.currentInventoryRow = row
        this.batchList = []
        this.batchDialogTitle = type === 'futures' ? '期货库存批次详情' : '现货库存批次详情'
        this.batchDialogVisible = true
        this.batchLoading = true
        const url = type === 'futures' ? '/erp/inventory/futures/batches' : '/erp/inventory/spot/batches'
        const params = type === 'futures'
          ? { packingItemId: row.packingItemId }
          : { presaleOrderId: row.presaleOrderId, productId: row.productId }
        this.$http({
          url: this.$http.adornUrl(url),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.batchList = data.list || []
          } else {
            this.batchList = []
            this.$message.error((data && data.msg) || '获取库存批次失败')
          }
          this.batchLoading = false
        }).catch(() => {
          this.batchLoading = false
        })
      },
      resetSpotQuery () {
        this.spotQuery = {
          keyword: '',
          warehouseName: '',
          containerNo: '',
          onlyAvailable: '1'
        }
        this.getSpotList()
      },
      resetFuturesQuery () {
        this.futuresQuery = {
          keyword: '',
          contractNo: '',
          containerNo: '',
          onlyAvailable: '0'
        }
        this.getFuturesList()
      },
      resetRecordQuery () {
        this.recordQuery = {
          keyword: '',
          recordType: '',
          contractNo: '',
          warehouseName: '',
          containerNo: ''
        }
        this.getRecordList()
      },
      formatDate (value) {
        if (!value) return ''
        const text = String(value)
        if (text.length >= 10) return text.substring(0, 10)
        return text
      },
      getTransferTagType (status) {
        if (status === '已转现货') return 'success'
        return 'info'
      }
    }
  }
</script>

<style scoped>
  .mod-erp-inventory .el-form {
    margin-bottom: 12px;
  }

  .inventory-danger {
    color: #f56c6c;
    font-weight: 600;
  }

  .batch-summary {
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
</style>
