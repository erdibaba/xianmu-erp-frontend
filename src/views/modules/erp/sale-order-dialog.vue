<template>
  <el-dialog
    :title="dialogTitle"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="96%"
    top="3vh"
    custom-class="sale-order-dialog-modal">
    <div class="sale-order-dialog" v-loading="detailLoading">
      <el-form
        ref="dataForm"
        :model="dataForm"
        :rules="dataRule"
        label-width="110px"
        @keyup.enter.native="dataFormSubmit()">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="销售类型" prop="saleType">
              <el-select
                v-model="dataForm.saleType"
                :disabled="contentReadonly"
                style="width: 100%;"
                @change="saleTypeChangeHandle">
                <el-option label="期货单" value="FUTURES"></el-option>
                <el-option label="现货单" value="SPOT"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="二批商" prop="secondaryPartnerId">
              <el-select
                v-model="dataForm.secondaryPartnerId"
                :disabled="contentReadonly"
                filterable
                clearable
                style="width: 100%;"
                placeholder="请选择二批商"
                @change="secondaryPartnerChangeHandle">
                <el-option
                  v-for="item in secondaryPartnerList"
                  :key="item.id"
                  :label="item.partnerName"
                  :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :prop="isSpotSale ? 'warehouseId' : ''" label="仓库">
              <el-select
                v-model="dataForm.warehouseId"
                :disabled="contentReadonly || !isSpotSale"
                filterable
                clearable
                style="width: 100%;"
                placeholder="请选择仓库"
                @change="warehouseChangeHandle">
                <el-option
                  v-for="item in warehouseList"
                  :key="item.id"
                  :label="item.warehouseName"
                  :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="合同号">
              <el-input v-model="dataForm.contractNo" :disabled="contentReadonly"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="签订日期" prop="contractSignDate">
              <el-date-picker
                v-model="dataForm.contractSignDate"
                :disabled="contentReadonly"
                type="date"
                value-format="yyyy-MM-dd"
                format="yyyy-MM-dd"
                style="width: 100%;"
                placeholder="请选择签订日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="销售单号">
              <el-input v-model="dataForm.orderNo" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="流程状态">
              <el-input :value="statusLabel" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="合同页面">
              <div class="contract-link-wrap">
                <el-button
                  v-if="dataForm.contractUrl"
                  type="text"
                  size="small"
                  @click="openContract()">
                  打开合同页面
                </el-button>
                <el-button
                  v-if="dataForm.contractUrl"
                  type="text"
                  size="small"
                  @click="copyContractUrl()">
                  复制链接
                </el-button>
                <span v-else>-</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="isFuturesSale" :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联预销售单" prop="sourcePresaleOrderId">
              <el-select
                v-model="dataForm.sourcePresaleOrderId"
                :disabled="contentReadonly"
                filterable
                clearable
                remote
                reserve-keyword
                style="width: 100%;"
                placeholder="输入预售合同号搜索"
                :loading="presaleOrderLoading"
                @visible-change="presaleOrderVisibleChange"
                :remote-method="remoteSearchPresaleOrders"
                @change="presaleOrderChangeHandle">
                <el-option
                  v-for="item in presaleOrderOptions"
                  :key="item.presaleOrderId"
                  :label="item.sellerContractNo || item.presaleOrderNo"
                  :value="item.presaleOrderId">
                  <div class="product-option-code">{{ item.sellerContractNo || item.presaleOrderNo }}</div>
                  <div class="product-option-name">{{ item.customerReference || '-' }} / {{ item.brandName || '-' }}</div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="dataForm.remark" :disabled="contentReadonly" type="textarea"></el-input>
        </el-form-item>

        <div class="sub-title">
          <span>{{ isSpotSale ? 'By产品录单明细' : '期货产品明细' }}</span>
          <div class="sub-title-actions">
            <el-button
              v-if="showSpotPreviewButton"
              size="mini"
              type="primary"
              plain
              :loading="previewLoading"
              @click="previewSpotAllocation">
              生成现货分配明细
            </el-button>
            <el-button
              v-if="!contentReadonly"
              size="mini"
              type="primary"
              plain
              @click="addItemRow()">
              新增明细
            </el-button>
          </div>
        </div>

        <el-table :data="dataForm.itemList" border size="mini" class="item-table">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>

          <el-table-column label="产品编码" min-width="220">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.productId"
                filterable
                clearable
                remote
                reserve-keyword
                size="mini"
                :disabled="contentReadonly"
                :loading="scope.row._productLoading"
                placeholder="输入产品编码/中文/英文搜索"
                style="width: 100%;"
                @visible-change="visible => productSelectVisibleChange(scope.row, visible)"
                :remote-method="keyword => remoteSearchProducts(scope.row, keyword)"
                @change="value => productSelectChange(scope.row, value)">
                <el-option
                  v-for="item in scope.row._productOptions"
                  :key="item.id"
                  :label="item.productCode"
                  :value="item.id">
                  <div class="product-option-code">{{ item.productCode }}</div>
                  <div class="product-option-name">{{ item.productName || '-' }} / {{ item.productNameEn || '-' }}</div>
                </el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column prop="productName" label="中文名称" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productSpec" label="规格" width="90"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>

          <el-table-column label="箱数" width="100">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.boxes"
                :disabled="contentReadonly"
                :controls="false"
                :precision="0"
                :min="0"
                size="mini"
                style="width: 100%;"
                @change="spotTopRowChange(scope.row)">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column label="销售价（元/千克）" width="150">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.salePriceKg"
                :disabled="contentReadonly"
                :controls="false"
                :min="0"
                :precision="2"
                size="mini"
                style="width: 100%;"
                @change="spotSalePriceChange(scope.row)">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column v-if="isFuturesSale" label="数量/千克" width="130">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.contractQuantityKg"
                :disabled="contentReadonly"
                :controls="false"
                :min="0"
                :precision="2"
                size="mini"
                style="width: 100%;">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column v-if="isFuturesSale" label="厂号" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.contractFactoryNo" :disabled="contentReadonly" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column v-if="isFuturesSale" label="港口/冷库" min-width="140">
            <template slot-scope="scope">
              <el-input v-model="scope.row.contractPortCold" :disabled="contentReadonly" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="备注" min-width="160">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" :disabled="contentReadonly" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column v-if="!contentReadonly" label="操作" width="80" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="removeItemRow(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="showSpotAllocation" class="sub-title">
          <span>系统自动分配结果</span>
          <span class="sub-title-tip">现货单需在每个柜号行录入数量/千克、厂号、港口/冷库</span>
        </div>
        <el-table
          v-if="showSpotAllocation"
          :data="dataForm.allocationItemList"
          border
          size="mini"
          class="allocation-table">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="120"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="boxes" label="分配箱数" width="90" align="center"></el-table-column>
          <el-table-column prop="sourceContainerNo" label="柜号" min-width="120"></el-table-column>
          <el-table-column label="销售价（元/千克）" width="150">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.salePriceKg"
                :disabled="true"
                :controls="false"
                :precision="2"
                size="mini"
                style="width: 100%;">
              </el-input-number>
            </template>
          </el-table-column>
          <el-table-column label="数量/千克" width="130">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.contractQuantityKg"
                :disabled="contentReadonly"
                :controls="false"
                :min="0"
                :precision="2"
                size="mini"
                style="width: 100%;">
              </el-input-number>
            </template>
          </el-table-column>
          <el-table-column label="厂号" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.contractFactoryNo" :disabled="contentReadonly" size="mini"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="港口/冷库" min-width="140">
            <template slot-scope="scope">
              <el-input v-model="scope.row.contractPortCold" :disabled="contentReadonly" size="mini"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="入库日期" width="120" align="center">
            <template slot-scope="scope">{{ formatDateOnly(scope.row.inboundDate) }}</template>
          </el-table-column>
          <el-table-column label="过期日期" width="120" align="center">
            <template slot-scope="scope">{{ formatDateOnly(scope.row.expiryDate) }}</template>
          </el-table-column>
        </el-table>

        <div v-if="dataForm.id" class="sub-title">合同与付款附件</div>
        <el-tabs v-if="dataForm.id" value="signedContract">
          <el-tab-pane label="盖章合同" name="signedContract">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('SIGNED_CONTRACT')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('SIGNED_CONTRACT')">
                上传盖章合同
              </el-button>
              <el-button
                v-if="attachmentEditable && canConfirmStep('SIGNED_CONTRACT')"
                size="mini"
                type="success"
                :loading="confirmLoading && currentConfirmType === 'SIGNED_CONTRACT'"
                @click="confirmStep('SIGNED_CONTRACT')">
                确认合同无误</el-button>
            </div>
            <el-table :data="getFileListByType('SIGNED_CONTRACT')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="下载" width="100" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('SIGNED_CONTRACT')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="二批打款凭证" name="buyerPayment">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('BUYER_PAYMENT_PROOF')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('BUYER_PAYMENT_PROOF')">
                上传二批打款凭证
              </el-button>
              <el-button
                v-if="attachmentEditable && canConfirmStep('BUYER_PAYMENT_PROOF')"
                size="mini"
                type="success"
                :loading="confirmLoading && currentConfirmType === 'BUYER_PAYMENT_PROOF'"
                @click="confirmStep('BUYER_PAYMENT_PROOF')">
                确认二批打款凭证
              </el-button>
            </div>
            <el-table :data="getFileListByType('BUYER_PAYMENT_PROOF')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="下载" width="100" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('BUYER_PAYMENT_PROOF')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="二批来款水单" name="buyerBank">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('BUYER_BANK_SLIP')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('BUYER_BANK_SLIP')">
                上传二批来款水单
              </el-button>
              <el-button
                v-if="attachmentEditable && canConfirmStep('BUYER_BANK_SLIP')"
                size="mini"
                type="success"
                :loading="confirmLoading && currentConfirmType === 'BUYER_BANK_SLIP'"
                @click="confirmStep('BUYER_BANK_SLIP')">
                确认二批来款水单
              </el-button>
            </div>
            <el-table :data="getFileListByType('BUYER_BANK_SLIP')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="下载" width="100" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('BUYER_BANK_SLIP')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="资方打款凭证" name="funderPayment">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('FUNDER_PAYMENT_PROOF')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('FUNDER_PAYMENT_PROOF')">
                上传资方打款凭证
              </el-button>
              <el-button
                v-if="attachmentEditable && canConfirmStep('FUNDER_PAYMENT_PROOF')"
                size="mini"
                type="success"
                :loading="confirmLoading && currentConfirmType === 'FUNDER_PAYMENT_PROOF'"
                @click="confirmStep('FUNDER_PAYMENT_PROOF')">
                确认资方打款凭证
              </el-button>
            </div>
            <el-table :data="getFileListByType('FUNDER_PAYMENT_PROOF')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="下载" width="100" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('FUNDER_PAYMENT_PROOF')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>

        <input ref="uploadInput" type="file" multiple style="display:none;" @change="uploadFileChangeHandle">
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button
        v-if="!contentReadonly"
        type="primary"
        :loading="saveLoading"
        @click="dataFormSubmit()">
        保存
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  data () {
    return {
      visible: false,
      readonly: false,
      detailLoading: false,
      previewLoading: false,
      saveLoading: false,
      uploadLoading: false,
      confirmLoading: false,
      currentUploadType: '',
      currentConfirmType: '',
      secondaryPartnerList: [],
      warehouseList: [],
      productList: [],
      presaleOrderOptions: [],
      presaleOrderKeyword: '',
      presaleOrderLoading: false,
      dataForm: this.defaultForm(),
      dataRule: {
        saleType: [{ required: true, message: '请选择销售类型', trigger: 'change' }],
        secondaryPartnerId: [{ required: true, message: '请选择二批商', trigger: 'change' }],
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        contractSignDate: [{ required: true, message: '请选择签订日期', trigger: 'change' }],
        sourcePresaleOrderId: [{ required: true, message: '请选择关联预销售单', trigger: 'change' }]
      }
    }
  },
  computed: {
    dialogTitle () {
      if (this.readonly) return '销售单详情'
      return this.dataForm.id ? '销售单附件处理' : '新增销售单'
    },
    isSpotSale () {
      return this.dataForm.saleType === 'SPOT'
    },
    isFuturesSale () {
      return this.dataForm.saleType === 'FUTURES'
    },
    statusLabel () {
      const map = {
        1: '待确认盖章合同',
        2: '待确认二批打款凭证',
        3: '待内部确认二批来款水单',
        4: '待内部确认资方打款凭证',
        5: '流程完成'
      }
      return map[this.dataForm.status] || '待处理'
    },
    contentReadonly () {
      return this.readonly || !!this.dataForm.id
    },
    attachmentEditable () {
      return !this.readonly && !!this.dataForm.id
    },
    showSpotPreviewButton () {
      return this.isSpotSale && !this.contentReadonly
    },
    showSpotAllocation () {
      return this.isSpotSale && this.dataForm.allocationItemList && this.dataForm.allocationItemList.length > 0
    }
  },
  methods: {
    defaultForm () {
      return {
        id: 0,
        orderNo: '',
        saleType: 'FUTURES',
        secondaryPartnerId: '',
        secondaryPartnerName: '',
        warehouseId: '',
        warehouseName: '',
        sourcePresaleOrderId: '',
        sourcePresaleOrderNo: '',
        contractNo: '',
        contractToken: '',
        contractUrl: '',
        buyerPortalUrl: '',
        contractSignDate: '',
        status: 1,
        signedContractConfirmed: 0,
        buyerPaymentConfirmed: 0,
        buyerBankConfirmed: 0,
        funderPaymentConfirmed: 0,
        remark: '',
        itemList: [],
        allocationItemList: [],
        fileList: []
      }
    },
    defaultItemRow () {
      return {
        id: 0,
        productId: '',
        productCode: '',
        productName: '',
        productNameEn: '',
        productSpec: '',
        unit: '',
        boxes: 0,
        salePriceKg: null,
        contractQuantityKg: null,
        contractFactoryNo: '',
        contractPortCold: '',
        sourcePresaleOrderId: '',
        sourcePresaleOrderNo: '',
        sourcePresaleOrderItemId: '',
        sourceContainerNo: '',
        expiryDate: '',
        remark: '',
        _productKeyword: '',
        _productPageSize: 15,
        _productLoading: false,
        _productOptions: [],
        _presaleKeyword: '',
        _presaleLoading: false,
        _presaleOptions: []
      }
    },
    defaultAllocationRow () {
      return {
        id: 0,
        lineNo: 0,
        productId: '',
        productCode: '',
        productName: '',
        productNameEn: '',
        productSpec: '',
        unit: '',
        boxes: 0,
        sourceInboundOrderId: '',
        sourceInboundItemId: '',
        sourceContainerNo: '',
        warehouseId: '',
        warehouseName: '',
        brandId: '',
        brandName: '',
        inboundDate: '',
        productionDate: '',
        expiryDate: '',
        specWeight: null,
        salePriceKg: null,
        contractQuantityKg: null,
        contractFactoryNo: '',
        contractPortCold: '',
        remark: ''
      }
    },
    init (id, readonly) {
      this.visible = true
      this.readonly = readonly
      this.currentUploadType = ''
      this.currentConfirmType = ''
      this.dataForm = this.defaultForm()
      this.detailLoading = true
      Promise.all([this.loadBaseOptions(), this.fetchDetail(id)]).finally(() => {
        this.detailLoading = false
      })
    },
    loadBaseOptions () {
      return Promise.all([this.loadSecondaryPartners(), this.loadWarehouses(), this.loadProductList()])
    },
    loadSecondaryPartners () {
      return this.$http({
        url: this.$http.adornUrl('/erp/partner/select'),
        method: 'get',
        params: this.$http.adornParams({ businessRole: 'SECONDARY' })
      }).then(({ data }) => {
        this.secondaryPartnerList = (data && data.list) || []
      })
    },
    loadWarehouses () {
      return this.$http({
        url: this.$http.adornUrl('/erp/warehouse/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.warehouseList = (data && data.list) || []
      })
    },
    loadProductList () {
      return this.$http({
        url: this.$http.adornUrl('/erp/product/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.productList = (data && data.list) || []
      })
    },
    fetchDetail (id) {
      if (!id) {
        this.dataForm.itemList = [this.defaultItemRow()]
        return Promise.resolve()
      }
      return this.$http({
        url: this.$http.adornUrl(`/erp/saleorder/info/${id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataForm = this.normalizeForm(data.saleOrder || {})
        } else {
          this.$message.error((data && data.msg) || '加载失败')
        }
      })
    },
    normalizeForm (form) {
      const source = form || {}
      const result = Object.assign(this.defaultForm(), source)
      result.contractSignDate = this.normalizeDateValue(source.contractSignDate)
      result.fileList = source.fileList || []
      result.itemList = (source.itemList || []).map(item => {
        const row = Object.assign(this.defaultItemRow(), item)
        row._productOptions = row.productId ? [{
          id: row.productId,
          productCode: row.productCode,
          productName: row.productName,
          productNameEn: row.productNameEn,
          productSpec: row.productSpec,
          unit: row.unit
        }] : []
        return row
      })
      result.allocationItemList = (source.allocationItemList || []).map(item => Object.assign(this.defaultAllocationRow(), item))
      if (result.saleType === 'FUTURES' && result.itemList.length) {
        result.sourcePresaleOrderId = result.itemList[0].sourcePresaleOrderId || ''
        result.sourcePresaleOrderNo = result.itemList[0].sourcePresaleOrderNo || ''
      }
      if (!result.itemList.length) {
        result.itemList = [this.defaultItemRow()]
      }
      return result
    },
    saleTypeChangeHandle (value) {
      if (value !== 'SPOT') {
        this.dataForm.warehouseId = ''
        this.dataForm.warehouseName = ''
        this.dataForm.allocationItemList = []
      }
      if (value !== 'FUTURES') {
        this.dataForm.sourcePresaleOrderId = ''
        this.dataForm.sourcePresaleOrderNo = ''
      }
      this.dataForm.itemList = [this.defaultItemRow()]
    },
    secondaryPartnerChangeHandle (value) {
      const partner = this.secondaryPartnerList.find(item => String(item.id) === String(value))
      this.dataForm.secondaryPartnerName = partner ? partner.partnerName : ''
    },
    warehouseChangeHandle (value) {
      const warehouse = this.warehouseList.find(item => String(item.id) === String(value))
      this.dataForm.warehouseName = warehouse ? warehouse.warehouseName : ''
      if (this.isSpotSale && !this.contentReadonly) {
        this.dataForm.allocationItemList = []
      }
    },
    addItemRow () {
      this.dataForm.itemList.push(this.defaultItemRow())
    },
    removeItemRow (index) {
      const removed = this.dataForm.itemList[index]
      this.dataForm.itemList.splice(index, 1)
      if (!this.dataForm.itemList.length) {
        this.dataForm.itemList.push(this.defaultItemRow())
      }
      if (this.isSpotSale && removed && removed.productId) {
        this.dataForm.allocationItemList = (this.dataForm.allocationItemList || []).filter(item => String(item.productId) !== String(removed.productId))
      }
    },
    spotTopRowChange () {
      if (this.isSpotSale && !this.contentReadonly) {
        this.dataForm.allocationItemList = []
      }
    },
    spotSalePriceChange (row) {
      if (!this.isSpotSale) return
      ;(this.dataForm.allocationItemList || []).forEach(item => {
        if (String(item.productId) === String(row.productId)) {
          item.salePriceKg = row.salePriceKg
        }
      })
    },
    productSelectVisibleChange (row, visible) {
      if (!visible || this.contentReadonly) return
      if (row._productOptions.length > 0) return
      row._productKeyword = row.productCode || ''
      this.fetchRowProductOptions(row)
    },
    remoteSearchProducts (row, keyword) {
      row._productKeyword = keyword
      this.fetchRowProductOptions(row)
    },
    fetchRowProductOptions (row) {
      row._productLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/product/selectPage'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: row._productPageSize,
          keyword: row._productKeyword
        })
      }).then(({ data }) => {
        row._productOptions = data && data.code === 0 ? (data.page.list || []) : []
        row._productLoading = false
      }).catch(() => {
        row._productOptions = []
        row._productLoading = false
      })
    },
    productSelectChange (row, value) {
      const product = row._productOptions.find(item => String(item.id) === String(value)) ||
        this.productList.find(item => String(item.id) === String(value))
      if (!product) {
        row.productId = ''
        row.productCode = ''
        row.productName = ''
        row.productNameEn = ''
        row.productSpec = ''
        row.unit = ''
        row.sourcePresaleOrderItemId = ''
        if (this.isSpotSale) {
          this.dataForm.allocationItemList = []
        }
        return
      }
      this.applyProductToRow(row, product)
      if (this.isFuturesSale) {
      } else {
        this.dataForm.allocationItemList = []
      }
    },
    applyProductToRow (row, product) {
      row.productId = product.id
      row.productCode = product.productCode
      row.productName = product.productName || ''
      row.productNameEn = product.productNameEn || ''
      row.productSpec = product.productSpec || ''
      row.unit = product.unit || ''
      if (!row._productOptions.find(item => String(item.id) === String(product.id))) {
        row._productOptions = [product].concat(row._productOptions)
      }
    },
    presaleOrderVisibleChange (visible) {
      if (!visible || this.contentReadonly || !this.isFuturesSale) return
      if (this.presaleOrderOptions.length > 0) return
      this.fetchPresaleOrderOptions()
    },
    remoteSearchPresaleOrders (keyword) {
      this.presaleOrderKeyword = keyword
      this.fetchPresaleOrderOptions()
    },
    fetchPresaleOrderOptions () {
      this.presaleOrderLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/presale-orders'),
        method: 'get',
        params: this.$http.adornParams({ keyword: this.presaleOrderKeyword })
      }).then(({ data }) => {
        this.presaleOrderOptions = data && data.code === 0 ? (data.list || []) : []
        this.presaleOrderLoading = false
      }).catch(() => {
        this.presaleOrderOptions = []
        this.presaleOrderLoading = false
      })
    },
    presaleOrderChangeHandle (value) {
      const item = this.presaleOrderOptions.find(option => String(option.presaleOrderId) === String(value))
      if (!item) {
        this.dataForm.sourcePresaleOrderId = ''
        this.dataForm.sourcePresaleOrderNo = ''
        return
      }
      this.dataForm.sourcePresaleOrderId = item.presaleOrderId
      this.dataForm.sourcePresaleOrderNo = item.sellerContractNo || item.presaleOrderNo || ''
    },
    presaleSelectVisibleChange (row, visible) {
      if (!visible || this.contentReadonly || this.isSpotSale) return
      if (!row.productId) return
      if (row._presaleOptions.length > 0) return
      this.fetchPresaleOptions(row)
    },
    remoteSearchPresaleItems (row, keyword) {
      row._presaleKeyword = keyword
      this.fetchPresaleOptions(row)
    },
    fetchPresaleOptions (row) {
      if (!row.productId) {
        row._presaleOptions = []
        return
      }
      row._presaleLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/presale-items'),
        method: 'get',
        params: this.$http.adornParams({
          productId: row.productId,
          keyword: row._presaleKeyword
        })
      }).then(({ data }) => {
        row._presaleOptions = data && data.code === 0 ? (data.list || []) : []
        row._presaleLoading = false
      }).catch(() => {
        row._presaleOptions = []
        row._presaleLoading = false
      })
    },
    presaleSelectChange (row, value) {
      const item = row._presaleOptions.find(option => String(option.presaleOrderItemId) === String(value))
      if (!item) {
        row.sourcePresaleOrderId = ''
        row.sourcePresaleOrderNo = ''
        row.sourcePresaleOrderItemId = ''
        return
      }
      row.sourcePresaleOrderId = item.presaleOrderId
      row.sourcePresaleOrderNo = item.presaleOrderNo
      row.sourcePresaleOrderItemId = item.presaleOrderItemId
    },
    previewSpotAllocation () {
      if (!this.isSpotSale || this.contentReadonly) return
      const previewError = this.validateSpotPreview()
      if (previewError) {
        this.$message.error(previewError)
        return
      }
      this.previewLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/preview-allocation'),
        method: 'post',
        data: this.$http.adornData(this.buildPreviewData())
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataForm.allocationItemList = (data.list || []).map(item => Object.assign(this.defaultAllocationRow(), item))
        } else {
          this.$message.error((data && data.msg) || '生成现货分配明细失败')
        }
        this.previewLoading = false
      }).catch(() => {
        this.previewLoading = false
      })
    },
    validateSpotPreview () {
      if (!this.dataForm.warehouseId) return '请先选择仓库'
      if (!this.dataForm.itemList.length) return '请先录入现货产品明细'
      const productIds = {}
      for (let index = 0; index < this.dataForm.itemList.length; index++) {
        const item = this.dataForm.itemList[index]
        if (!item.productId) return `现货单第${index + 1}行产品未选择`
        if (!item.boxes || Number(item.boxes) <= 0) return `现货单第${index + 1}行箱数必须大于0`
        if (item.salePriceKg === null || item.salePriceKg === '' || Number(item.salePriceKg) <= 0) {
          return `现货单第${index + 1}行销售价（元/千克）必须大于0`
        }
        if (productIds[item.productId]) return '现货单不支持重复录入同一产品，请合并箱数后再生成分配明细'
        productIds[item.productId] = true
      }
      return ''
    },
    buildPreviewData () {
      return {
        saleType: this.dataForm.saleType,
        warehouseId: this.dataForm.warehouseId,
        itemList: (this.dataForm.itemList || []).map((item, index) => ({
          lineNo: index + 1,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          productSpec: item.productSpec,
          unit: item.unit,
          boxes: item.boxes,
          salePriceKg: item.salePriceKg,
          remark: item.remark
        })),
        allocationItemList: (this.dataForm.allocationItemList || []).map(item => ({
          sourceInboundItemId: item.sourceInboundItemId,
          contractQuantityKg: item.contractQuantityKg,
          contractFactoryNo: item.contractFactoryNo,
          contractPortCold: item.contractPortCold
        }))
      }
    },
    validateItemList () {
      const itemList = this.dataForm.itemList || []
      if (!itemList.length) return '销售明细不能为空'
      const productIds = {}
      if (this.isFuturesSale && !this.dataForm.sourcePresaleOrderId) return '请选择关联预销售单'
      for (let index = 0; index < itemList.length; index++) {
        const item = itemList[index]
        if (!item.productId) return `第${index + 1}行产品未选择`
        if (!item.boxes || Number(item.boxes) <= 0) return `第${index + 1}行箱数必须大于0`
        if (item.salePriceKg === null || item.salePriceKg === '' || Number(item.salePriceKg) <= 0) {
          return `第${index + 1}行销售价（元/千克）必须大于0`
        }
        if (this.isSpotSale) {
          if (productIds[item.productId]) return '现货单不支持重复录入同一产品，请合并箱数'
          productIds[item.productId] = true
        } else {
          if (item.contractQuantityKg === null || item.contractQuantityKg === '' || Number(item.contractQuantityKg) <= 0) {
            return `第${index + 1}行数量/千克必须大于0`
          }
          if (!item.contractFactoryNo) return `第${index + 1}行厂号不能为空`
          if (!item.contractPortCold) return `第${index + 1}行港口/冷库不能为空`
        }
      }
      if (this.isSpotSale) {
        const allocationList = this.dataForm.allocationItemList || []
        if (!allocationList.length) return '请先生成现货分配明细'
        for (let index = 0; index < allocationList.length; index++) {
          const item = allocationList[index]
          if (item.contractQuantityKg === null || item.contractQuantityKg === '' || Number(item.contractQuantityKg) <= 0) {
            return `第${index + 1}条分配明细数量/千克必须大于0`
          }
          if (!item.contractFactoryNo) return `第${index + 1}条分配明细厂号不能为空`
          if (!item.contractPortCold) return `第${index + 1}条分配明细港口/冷库不能为空`
        }
      }
      return ''
    },
    buildSubmitData () {
      return Object.assign({}, this.dataForm, {
        itemList: (this.dataForm.itemList || []).map((item, index) => ({
          id: item.id,
          lineNo: index + 1,
          saleType: this.dataForm.saleType,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          productSpec: item.productSpec,
          unit: item.unit,
          boxes: item.boxes,
          salePriceKg: item.salePriceKg,
          contractQuantityKg: item.contractQuantityKg,
          contractFactoryNo: item.contractFactoryNo,
          contractPortCold: item.contractPortCold,
          sourcePresaleOrderId: this.dataForm.sourcePresaleOrderId,
          sourcePresaleOrderNo: this.dataForm.sourcePresaleOrderNo,
          sourcePresaleOrderItemId: item.sourcePresaleOrderItemId,
          remark: item.remark
        })),
        allocationItemList: (this.dataForm.allocationItemList || []).map((item, index) => ({
          id: item.id,
          lineNo: index + 1,
          saleType: this.dataForm.saleType,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          productSpec: item.productSpec,
          unit: item.unit,
          boxes: item.boxes,
          salePriceKg: item.salePriceKg,
          contractQuantityKg: item.contractQuantityKg,
          contractFactoryNo: item.contractFactoryNo,
          contractPortCold: item.contractPortCold,
          sourceInboundOrderId: item.sourceInboundOrderId,
          sourceInboundItemId: item.sourceInboundItemId,
          sourceContainerNo: item.sourceContainerNo,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          brandId: item.brandId,
          brandName: item.brandName,
          inboundDate: item.inboundDate,
          productionDate: item.productionDate,
          expiryDate: item.expiryDate,
          specWeight: item.specWeight,
          remark: item.remark
        }))
      })
    },
    dataFormSubmit () {
      if (this.contentReadonly) return
      this.$refs.dataForm.validate((valid) => {
        if (!valid) return false
        const itemError = this.validateItemList()
        if (itemError) {
          this.$message.error(itemError)
          return false
        }
        this.saveLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/saleorder/save'),
          method: 'post',
          data: this.$http.adornData(this.buildSubmitData())
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('保存成功')
            this.visible = false
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '保存失败')
          }
          this.saveLoading = false
        }).catch(() => {
          this.saveLoading = false
        })
      })
    },
    getFileListByType (fileType) {
      return (this.dataForm.fileList || []).filter(item => item.fileType === fileType)
    },
    isStepConfirmed (fileType) {
      if (fileType === 'SIGNED_CONTRACT') return Number(this.dataForm.signedContractConfirmed || 0) === 1
      if (fileType === 'BUYER_PAYMENT_PROOF') return Number(this.dataForm.buyerPaymentConfirmed || 0) === 1
      if (fileType === 'BUYER_BANK_SLIP') return Number(this.dataForm.buyerBankConfirmed || 0) === 1
      if (fileType === 'FUNDER_PAYMENT_PROOF') return Number(this.dataForm.funderPaymentConfirmed || 0) === 1
      return false
    },
    canConfirmStep (fileType) {
      if (this.isStepConfirmed(fileType)) return false
      if (this.getFileListByType(fileType).length <= 0) return false
      if (fileType === 'SIGNED_CONTRACT') return true
      if (fileType === 'BUYER_PAYMENT_PROOF') return this.isStepConfirmed('SIGNED_CONTRACT')
      if (fileType === 'BUYER_BANK_SLIP') return this.isStepConfirmed('BUYER_PAYMENT_PROOF')
      if (fileType === 'FUNDER_PAYMENT_PROOF') return this.isStepConfirmed('BUYER_BANK_SLIP')
      return false
    },
    canDeleteStep (fileType) {
      return !this.isStepConfirmed(fileType)
    },
    canUploadStep (fileType) {
      return !this.isStepConfirmed(fileType)
    },
    triggerUpload (fileType) {
      if (!this.attachmentEditable) return
      this.currentUploadType = fileType
      this.$refs.uploadInput.value = ''
      this.$refs.uploadInput.click()
    },
    confirmStep (fileType) {
      if (!this.dataForm.id) return
      this.confirmLoading = true
      this.currentConfirmType = fileType
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/confirm'),
        method: 'post',
        data: this.$http.adornData({
          saleOrderId: this.dataForm.id,
          fileType
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('确认成功')
          this.refreshDetail()
          this.$emit('refreshDataList')
        } else {
          this.$message.error((data && data.msg) || '确认失败')
        }
        this.confirmLoading = false
        this.currentConfirmType = ''
      }).catch(() => {
        this.confirmLoading = false
        this.currentConfirmType = ''
      })
    },
    openContract () {
      if (!this.dataForm.contractUrl) {
        this.$message.error('合同链接不存在')
        return
      }
      window.open(this.dataForm.contractUrl, '_blank')
    },
    copyContractUrl () {
      if (!this.dataForm.contractUrl) {
        this.$message.error('合同链接不存在')
        return
      }
      const text = String(this.dataForm.contractUrl)
      const fallbackCopy = () => {
        const input = document.createElement('textarea')
        input.value = text
        input.setAttribute('readonly', 'readonly')
        input.style.position = 'fixed'
        input.style.top = '-9999px'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      const success = () => this.$message.success('链接已复制')
      const failure = () => this.$message.error('复制失败，请手动复制')
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(success).catch(() => {
          try {
            fallbackCopy()
            success()
          } catch (e) {
            failure()
          }
        })
        return
      }
      try {
        fallbackCopy()
        success()
      } catch (e) {
        failure()
      }
    },
    uploadFileChangeHandle (event) {
      const files = Array.from((event.target && event.target.files) || [])
      if (!files.length || !this.currentUploadType || !this.dataForm.id) return
      const formData = new FormData()
      formData.append('saleOrderId', this.dataForm.id)
      formData.append('fileType', this.currentUploadType)
      files.forEach(file => formData.append('files', file))
      this.uploadLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/upload'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('上传成功')
          this.refreshDetail()
          this.$emit('refreshDataList')
        } else {
          this.$message.error((data && data.msg) || '上传失败')
        }
        this.uploadLoading = false
      }).catch(() => {
        this.uploadLoading = false
      })
    },
    refreshDetail () {
      if (!this.dataForm.id) return
      this.detailLoading = true
      this.fetchDetail(this.dataForm.id).finally(() => {
        this.detailLoading = false
      })
    },
    downloadFile (row) {
      if (!row.id) {
        this.$message.error('缺少文件ID')
        return
      }
      window.open(this.$http.adornUrl(`/erp/saleorder/download/file/${row.id}`), '_blank')
    },
    deleteFile (row) {
      if (!row || !row.id) return
      this.$confirm('确认删除这条上传记录？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: this.$http.adornUrl(`/erp/saleorder/delete/file/${row.id}`),
          method: 'post',
          data: this.$http.adornData({})
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('删除成功')
            this.refreshDetail()
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '删除失败')
          }
        })
      }).catch(() => {})
    },
    formatDateOnly (value) {
      return value ? String(value).slice(0, 10) : ''
    },
    normalizeDateValue (value) {
      if (!value) return ''
      return String(value).slice(0, 10)
    },
    formatDateTime (value) {
      return value ? String(value).slice(0, 19).replace('T', ' ') : ''
    }
  }
}
</script>

<style scoped>
.sale-order-dialog {
  height: calc(100vh - 180px);
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
}

.sale-order-dialog /deep/ .el-form-item {
  margin-bottom: 14px;
}

.sub-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 12px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.sub-title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-title-tip {
  color: #909399;
  font-size: 12px;
  font-weight: 400;
}

.item-table /deep/ .el-table__body-wrapper {
  max-height: 280px;
  overflow-y: auto;
}

.allocation-table /deep/ .el-table__body-wrapper,
.attachment-table /deep/ .el-table__body-wrapper {
  max-height: 220px;
  overflow-y: auto;
}

.attachment-toolbar {
  margin-bottom: 8px;
}

.contract-link-wrap {
  line-height: 32px;
}

.product-option-code {
  color: #303133;
  font-weight: 600;
  line-height: 18px;
}

.product-option-name {
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}
</style>




