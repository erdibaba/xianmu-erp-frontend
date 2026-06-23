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
          warehouseId: '',
          containerNos: [],
          factoryNo: ''
        },
        dataList: [],
        selectedRows: [],
        adjustList: [],
        containerOptions: [],
        recognizedFileList: [],
        defaultTargetWarehouseId: '',
        defaultTargetWarehouseName: '',
        extendDays: '',
        loading: false,
        containerLoading: false,
        uploadLoading: false
      }
    },
    computed: {
      isWarehouseTransfer () {
        return this.adjustmentType === 'WAREHOUSE_TRANSFER'
      },
      isFreshToFrozen () {
        return this.adjustmentType === 'FRESH_TO_FROZEN'
      },
      uploadButtonText () {
        return this.isWarehouseTransfer ? '上传识别转仓库单据' : '上传识别鲜转冻单据'
      },
      uploadLoadingText () {
        return this.isWarehouseTransfer ? '正在识别并归档转仓库单据...' : '正在识别并归档鲜转冻单据...'
      },
      uploadSuccessText () {
        return this.isWarehouseTransfer ? '转仓库单据识别完成' : '鲜转冻单据识别完成'
      },
      uploadFailText () {
        return this.isWarehouseTransfer ? '转仓库单据识别失败' : '鲜转冻单据识别失败'
      },
      targetWarehouseLabel () {
        return this.isWarehouseTransfer ? '目标仓库' : '转入仓库'
      }
    },
    methods: {
      getDataList () {
        if (!this.query.warehouseId) {
          this.$message.warning('请先选择仓库')
          return
        }
        if (!this.query.containerNos || !this.query.containerNos.length) {
          this.$message.warning('请至少选择一个柜号')
          return
        }
        this.loading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-adjustment/lots'),
          method: 'get',
          params: this.$http.adornParams(Object.assign({}, this.query, {
            containerNos: this.query.containerNos.join(','),
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
            this.selectedRows = []
          } else {
            this.dataList = []
            this.selectedRows = []
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
          warehouseId: '',
          containerNos: [],
          factoryNo: ''
        }
        this.dataList = []
        this.selectedRows = []
        this.containerOptions = []
      },
      selectionChangeHandle (rows) {
        this.selectedRows = rows || []
      },
      sourceWarehouseChange () {
        this.query.containerNos = []
        this.containerOptions = []
        this.dataList = []
        this.selectedRows = []
        this.remoteSearchContainers('')
      },
      remoteSearchContainers (keyword) {
        if (!this.query.warehouseId) {
          this.containerOptions = []
          return
        }
        this.containerLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-adjustment/containers'),
          method: 'get',
          params: this.$http.adornParams({
            adjustmentType: this.adjustmentType,
            warehouseId: this.query.warehouseId,
            keyword: keyword || ''
          })
        }).then(({data}) => {
          const list = (data && data.list) || []
          const selected = this.query.containerNos || []
          this.containerOptions = Array.from(new Set(selected.concat(list)))
          this.containerLoading = false
        }).catch(() => {
          this.containerLoading = false
        })
      },
      targetWarehouseChange (row) {
        const warehouse = this.warehouseList.find(item => String(item.id) === String(row.targetWarehouseId))
        row.targetWarehouseName = warehouse ? warehouse.warehouseName : ''
      },
      defaultTargetWarehouseChange () {
        const warehouse = this.warehouseList.find(item => String(item.id) === String(this.defaultTargetWarehouseId))
        this.defaultTargetWarehouseName = warehouse ? warehouse.warehouseName : ''
      },
      applyDefaultWarehouse () {
        if (!this.defaultTargetWarehouseId) {
          this.$message.warning(`请先选择${this.targetWarehouseLabel}`)
          return
        }
        const rows = this.adjustList
        if (!rows.length) {
          this.$message.warning('请先加入待调整列表')
          return
        }
        rows.forEach(row => {
          this.$set(row, 'targetWarehouseId', this.defaultTargetWarehouseId)
          this.$set(row, 'targetWarehouseName', this.defaultTargetWarehouseName)
        })
      },
      extendExpiryDaysHandle () {
        const days = Number(this.extendDays)
        if (!days || days <= 0) {
          this.$message.warning('请输入大于0的延长天数')
          return
        }
        const rows = this.adjustList
        if (!rows.length) {
          this.$message.warning('请先加入待调整列表')
          return
        }
        let skipped = 0
        rows.forEach(row => {
          const baseDate = this.formatDate(row.expiryDate)
          if (!baseDate) {
            skipped++
            return
          }
          this.$set(row, 'targetExpiryDate', this.addDays(baseDate, days))
        })
        if (skipped > 0) {
          this.$message.warning(`已处理可计算行，${skipped}行缺少原过期日期，请手动填写`)
        }
      },
      beforeUpload (file) {
        const name = String(file.name || '').toLowerCase()
        const valid = ['.jpg', '.jpeg', '.png', '.jfif', '.bmp', '.pdf'].some(ext => name.endsWith(ext))
        if (!valid) {
          this.$message.error('仅支持 JPG / PNG / JFIF / BMP / PDF')
        }
        return valid
      },
      recognizeAdjustmentRequest (request) {
        const formData = new FormData()
        formData.append('adjustmentType', this.adjustmentType)
        formData.append('files', request.file)
        this.uploadLoading = true
        const loading = this.$loading({
          lock: true,
          text: this.uploadLoadingText,
          spinner: 'el-icon-loading',
          background: 'rgba(255, 255, 255, 0.65)'
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-adjustment/recognize'),
          method: 'post',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(({data}) => {
          loading.close()
          this.uploadLoading = false
          if (data && data.code === 0) {
            this.applyRecognizedResult(data.result || {})
            this.$message.success(this.uploadSuccessText)
          } else {
            this.$message.error((data && data.msg) || this.uploadFailText)
          }
        }).catch(() => {
          loading.close()
          this.uploadLoading = false
        })
      },
      applyRecognizedResult (result) {
        this.recognizedFileList = this.recognizedFileList.concat(result.fileList || [])
        let unmatchedCount = 0
        let addedCount = 0
        ;(result.itemList || []).forEach(item => {
          if (!item || !item.matched) {
            unmatchedCount++
            return
          }
          const row = this.buildRecognizedRow(item)
          this.upsertAdjustRow(row)
          addedCount++
        })
        if (unmatchedCount > 0) {
          this.$message.warning(`已加入${addedCount}条匹配明细，${unmatchedCount}条未匹配明细未加入调整列表`)
        }
      },
      buildRecognizedRow (item) {
        const matched = !!item.matched
        return Object.assign({}, item, {
          _unmatched: !matched,
          _recognized: true,
          productCode: matched ? item.productCode : item.recognizedProductCode,
          productName: matched ? item.productName : item.recognizedProductName,
          productNameEn: item.productNameEn || '',
          warehouseName: item.warehouseName || '',
          containerNo: item.containerNo || item.recognizedContainerNo || '',
          factoryNo: item.factoryNo || item.recognizedFactoryNo || '',
          temperatureZone: item.temperatureZone || (this.isFreshToFrozen ? '冷鲜' : ''),
          transferBoxes: item.recognizedActualQty || '',
          transferWeightKg: item.recognizedTotalWeightKg || '',
          targetWarehouseId: this.defaultTargetWarehouseId || '',
          targetWarehouseName: this.defaultTargetWarehouseName || '',
          targetExpiryDate: this.isWarehouseTransfer ? item.expiryDate : '',
          lotType: matched ? item.lotType : 'UNMATCHED'
        })
      },
      addSelectedToAdjustList () {
        if (!this.selectedRows.length) {
          this.$message.warning('请先勾选候选库存')
          return
        }
        this.selectedRows.forEach(row => {
          this.upsertAdjustRow(this.buildAdjustRow(row))
        })
        this.$message.success('已加入待调整列表')
      },
      buildAdjustRow (row) {
        return Object.assign({}, row, {
          transferBoxes: row.transferBoxes || '',
          transferWeightKg: row.transferWeightKg || '',
          targetWarehouseId: row.targetWarehouseId || this.defaultTargetWarehouseId || '',
          targetWarehouseName: row.targetWarehouseName || this.defaultTargetWarehouseName || '',
          targetExpiryDate: this.isWarehouseTransfer ? (row.targetExpiryDate || row.expiryDate) : (row.targetExpiryDate || '')
        })
      },
      upsertAdjustRow (row) {
        const index = this.adjustList.findIndex(item => this.sameLot(item, row))
        if (index >= 0) {
          const merged = Object.assign({}, this.adjustList[index], row)
          this.$set(this.adjustList, index, merged)
          return merged
        }
        this.adjustList.push(row)
        return row
      },
      removeAdjustRow (index) {
        this.adjustList.splice(index, 1)
      },
      sameLot (left, right) {
        return String(left.sourceAdjustmentItemId || '') === String(right.sourceAdjustmentItemId || '') &&
          String(left.inboundItemId || '') === String(right.inboundItemId || '') &&
          String(left.packingItemId || '') === String(right.packingItemId || '') &&
          String(left.batchId || '') === String(right.batchId || '') &&
          String(left.productCode || '') === String(right.productCode || '') &&
          String(left.containerNo || '') === String(right.containerNo || '') &&
          String(left.factoryNo || '') === String(right.factoryNo || '') &&
          this.formatDate(left.productionDate) === this.formatDate(right.productionDate) &&
          this.formatDate(left.expiryDate) === this.formatDate(right.expiryDate)
      },
      submitHandle () {
        if (!this.adjustList.length) {
          this.$message.warning('请先加入待调整列表')
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
            fileList: this.recognizedFileList,
            itemList: this.adjustList.map(row => ({
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
            this.recognizedFileList = []
            this.extendDays = ''
            this.adjustList = []
            this.selectedRows = []
            this.dataList = []
          } else {
            this.$message.error((data && data.msg) || '库存调整失败')
          }
        }).catch(() => {
          loading.close()
        })
      },
      validateRows () {
        for (let i = 0; i < this.adjustList.length; i++) {
          const row = this.adjustList[i]
          const rowNo = i + 1
          const boxes = Number(row.transferBoxes)
          const weight = Number(this.normalizeAmount(row.transferWeightKg))
          if (row._unmatched) return `第${rowNo}行${this.isWarehouseTransfer ? '未匹配到可用库存' : '未匹配到冷鲜库存'}，不能确认调整`
          if (!boxes || boxes <= 0) return `第${rowNo}行调整箱数必须大于0`
          if (boxes > Number(row.availableBoxes || 0)) return `第${rowNo}行调整箱数不能大于可售箱数`
          if (!weight || weight <= 0) return `第${rowNo}行调整重量必须大于0`
          if (this.isWarehouseTransfer && weight > Number(row.availableWeightKg || 0)) return `第${rowNo}行调整重量不能大于可售重量`
          if (this.isWarehouseTransfer) {
            if (!row.targetWarehouseId) return `第${rowNo}行请选择目标仓库`
            if (String(row.targetWarehouseId) === String(row.warehouseId)) return `第${rowNo}行目标仓库不能和原仓库相同`
          } else {
            if (!row.targetWarehouseId) return `第${rowNo}行请选择转入仓库`
            if (!row.targetExpiryDate) return `第${rowNo}行请输入转冷冻后的过期日期`
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
      },
      addDays (dateText, days) {
        const date = new Date(`${dateText}T00:00:00`)
        date.setDate(date.getDate() + days)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    },
    template: `
      <div class="adjust-panel">
        <section class="adjust-workflow-card source-card">
          <div class="adjust-card-heading">
            <div>
              <div class="adjust-step-title"><span class="adjust-step-number">1</span>获取待调整库存</div>
              <div class="adjust-step-desc">可以按仓库和柜号查询，也可以上传单据识别。</div>
            </div>
          </div>
          <div class="adjust-source-layout">
            <div class="adjust-query-area">
              <div class="adjust-area-label">按库存查询</div>
              <el-form :inline="true" :model="query" size="small" class="adjust-query-form">
                <el-form-item label="来源仓库">
                  <el-select v-model="query.warehouseId" filterable clearable placeholder="请选择来源仓库" style="width: 190px;" @change="sourceWarehouseChange">
                    <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="柜号">
                  <el-select
                    v-model="query.containerNos"
                    multiple
                    filterable
                    remote
                    clearable
                    reserve-keyword
                    :disabled="!query.warehouseId"
                    :loading="containerLoading"
                    :remote-method="remoteSearchContainers"
                    placeholder="请选择柜号"
                    style="width: 260px;">
                    <el-option v-for="item in containerOptions" :key="item" :label="item" :value="item"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="产品">
                  <el-input v-model="query.keyword" placeholder="编码/中文名/英文名" clearable @keyup.enter.native="getDataList()" style="width: 190px;"></el-input>
                </el-form-item>
                <el-form-item label="厂号">
                  <el-input v-model="query.factoryNo" placeholder="请输入厂号" clearable @keyup.enter.native="getDataList()" style="width: 130px;"></el-input>
                </el-form-item>
                <el-form-item class="adjust-query-actions">
                  <el-button type="primary" @click="getDataList()">查询库存</el-button>
                  <el-button @click="resetQuery()">重置</el-button>
                </el-form-item>
              </el-form>
            </div>
            <div class="adjust-upload-area">
              <div class="adjust-area-label">按单据识别</div>
              <div class="adjust-upload-desc">上传单据后，已匹配明细会直接加入待调整列表。</div>
              <el-upload
                action="#"
                :show-file-list="false"
                :http-request="recognizeAdjustmentRequest"
                :before-upload="beforeUpload"
                accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                <el-button type="warning" :loading="uploadLoading">{{ uploadButtonText }}</el-button>
              </el-upload>
            </div>
          </div>
          <div class="adjust-section-heading">
            <div>
              <div class="adjust-section-title">候选库存列表</div>
              <div class="adjust-section-subtitle">勾选需要处理的库存，再加入待调整列表。</div>
            </div>
            <el-button type="primary" plain size="small" @click="addSelectedToAdjustList()">加入调整列表</el-button>
          </div>
        <el-table ref="candidateTable" :data="dataList" border stripe height="300" v-loading="loading" @selection-change="selectionChangeHandle">
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
          <el-table-column prop="lotType" label="来源" width="90" align="center" header-align="center">
            <template slot-scope="scope">{{ scope.row.lotType === 'ADJUSTMENT' ? '调整后' : '入库' }}</template>
          </el-table-column>
        </el-table>
        </section>

        <section class="adjust-workflow-card batch-setting-card">
          <div class="adjust-card-heading">
            <div>
              <div class="adjust-step-title"><span class="adjust-step-number">2</span>批量设置调整参数</div>
              <div class="adjust-step-desc">批量设置会应用到当前待调整列表，每一行仍可单独修改。</div>
            </div>
          </div>
          <el-form :inline="true" size="small" class="adjust-batch-form">
            <el-form-item :label="targetWarehouseLabel">
              <el-select v-model="defaultTargetWarehouseId" filterable clearable placeholder="请选择仓库" style="width: 210px;" @change="defaultTargetWarehouseChange">
                <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button @click="applyDefaultWarehouse()">批量应用{{ targetWarehouseLabel }}</el-button>
            </el-form-item>
            <template v-if="isFreshToFrozen">
              <span class="adjust-batch-divider"></span>
              <el-form-item label="延长过期天数">
                <el-input-number v-model="extendDays" :min="1" :precision="0" :controls="false" style="width: 110px;"></el-input-number>
              </el-form-item>
              <el-form-item>
                <el-button @click="extendExpiryDaysHandle()">批量应用延长天数</el-button>
              </el-form-item>
            </template>
          </el-form>
        </section>

        <section class="adjust-workflow-card adjust-list-card">
          <div class="adjust-section-heading adjust-list-heading">
            <div>
              <div class="adjust-step-title"><span class="adjust-step-number">3</span>待调整列表</div>
              <div class="adjust-step-desc">核对箱数、重量和目标仓库后再确认，确认后不能撤销。</div>
            </div>
            <el-button v-if="isAuth('erp:inventory-adjustment:save')" type="success" @click="submitHandle()">确认调整</el-button>
          </div>
          <el-table ref="adjustTable" :data="adjustList" border stripe height="360" empty-text="请先查询勾选库存或上传识别单据后加入调整列表">
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
          <el-table-column prop="recognizedActualQty" label="识别箱数" width="95" align="right" header-align="center"></el-table-column>
          <el-table-column prop="recognizedTotalWeightKg" label="识别重量KG" width="115" align="right" header-align="center"></el-table-column>
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
          <el-table-column v-if="isWarehouseTransfer || isFreshToFrozen" :label="isFreshToFrozen ? '转入仓库' : '目标仓库'" min-width="170" align="center" header-align="center">
            <template slot-scope="scope">
              <el-select v-model="scope.row.targetWarehouseId" filterable clearable size="small" style="width: 150px;" @change="targetWarehouseChange(scope.row)">
                <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column v-if="isFreshToFrozen" label="转冷冻后过期日期" width="170" align="center" header-align="center">
            <template slot-scope="scope">
              <el-date-picker v-model="scope.row.targetExpiryDate" type="date" value-format="yyyy-MM-dd" size="small" style="width: 145px;"></el-date-picker>
            </template>
          </el-table-column>
          <el-table-column prop="matchMessage" label="匹配状态" min-width="230" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag
                :type="scope.row._unmatched ? 'danger' : 'success'"
                size="small"
                class="match-status-tag"
                :title="scope.row.matchMessage || (scope.row._unmatched ? '未匹配' : '已匹配')">
                {{ scope.row.matchMessage || (scope.row._unmatched ? '未匹配' : '已匹配') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lotType" label="来源" width="90" align="center" header-align="center">
            <template slot-scope="scope">{{ scope.row.lotType === 'ADJUSTMENT' ? '调整后' : '入库' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right" align="center" header-align="center">
            <template slot-scope="scope">
              <el-button type="text" class="adjust-remove-button" size="small" @click="removeAdjustRow(scope.$index)">移除</el-button>
            </template>
          </el-table-column>
          </el-table>
        </section>
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
    },
    methods: {
      handleTabChange () {},
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

<style>
  .mod-erp-stock-adjustment .adjust-tip {
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid #d9ecff;
    border-radius: 8px;
    background: #ecf5ff;
    color: #3a6f9f;
    line-height: 1.5;
  }

  .adjust-panel {
    padding-bottom: 8px;
  }

  .adjust-panel .adjust-workflow-card {
    margin-bottom: 14px;
    padding: 16px;
    border: 1px solid #dfe8ef;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 3px 12px rgba(29, 76, 108, 0.05);
  }

  .adjust-panel .adjust-card-heading,
  .adjust-panel .adjust-section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .adjust-panel .adjust-card-heading {
    margin-bottom: 14px;
  }

  .adjust-panel .adjust-step-title {
    display: flex;
    align-items: center;
    color: #183f5a;
    font-size: 16px;
    font-weight: 700;
  }

  .adjust-panel .adjust-step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-right: 8px;
    border-radius: 50%;
    background: #1678b8;
    color: #fff;
    font-size: 13px;
  }

  .adjust-panel .adjust-step-desc {
    margin-top: 5px;
    color: #7c8e9b;
    font-size: 12px;
    line-height: 1.5;
  }

  .adjust-panel .adjust-source-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 14px;
    margin-bottom: 16px;
  }

  .adjust-panel .adjust-query-area,
  .adjust-panel .adjust-upload-area {
    padding: 14px;
    border-radius: 8px;
  }

  .adjust-panel .adjust-query-area {
    border: 1px solid #e3ebf0;
    background: #f8fafc;
  }

  .adjust-panel .adjust-upload-area {
    border: 1px dashed #e4b267;
    background: #fff9ef;
  }

  .adjust-panel .adjust-area-label {
    margin-bottom: 12px;
    color: #34556b;
    font-size: 13px;
    font-weight: 700;
  }

  .adjust-panel .adjust-upload-desc {
    min-height: 42px;
    margin-bottom: 12px;
    color: #8b7555;
    font-size: 12px;
    line-height: 1.6;
  }

  .adjust-panel .adjust-query-form,
  .adjust-panel .adjust-batch-form {
    margin-bottom: -10px;
  }

  .adjust-panel .adjust-query-actions {
    margin-left: 4px;
  }

  .adjust-panel .adjust-section-title {
    font-size: 14px;
    font-weight: 600;
    color: #204f74;
  }

  .adjust-panel .adjust-section-subtitle {
    margin-top: 4px;
    font-size: 12px;
    font-weight: normal;
    color: #909399;
  }

  .adjust-panel .batch-setting-card {
    border-color: #cfe3ef;
    background: linear-gradient(135deg, #f4f9fc 0%, #eef6fa 100%);
  }

  .adjust-panel .adjust-batch-form {
    padding: 4px 0 0 32px;
  }

  .adjust-panel .adjust-batch-divider {
    display: inline-block;
    width: 1px;
    height: 28px;
    margin: 1px 18px 0 4px;
    vertical-align: top;
    background: #cbdbe5;
  }

  .adjust-panel .adjust-list-heading {
    margin-bottom: 12px;
  }

  .adjust-panel .adjust-remove-button {
    color: #e05252;
  }

  .adjust-panel .match-status-tag {
    max-width: 100%;
    height: auto;
    line-height: 20px;
    white-space: normal;
    word-break: break-all;
  }

  @media (max-width: 1180px) {
    .adjust-panel .adjust-source-layout {
      grid-template-columns: 1fr;
    }

    .adjust-panel .adjust-upload-area {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .adjust-panel .adjust-upload-area .adjust-area-label,
    .adjust-panel .adjust-upload-area .adjust-upload-desc {
      margin-bottom: 0;
    }
  }

  @media (max-width: 768px) {
    .adjust-panel .adjust-workflow-card {
      padding: 12px;
    }

    .adjust-panel .adjust-card-heading,
    .adjust-panel .adjust-section-heading,
    .adjust-panel .adjust-upload-area {
      align-items: flex-start;
      flex-direction: column;
    }

    .adjust-panel .adjust-batch-form {
      padding-left: 0;
    }

    .adjust-panel .adjust-batch-divider {
      display: none;
    }
  }
</style>
