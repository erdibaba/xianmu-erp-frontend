<template>
  <el-dialog
    :title="dialogTitle"
    :close-on-click-modal="false"
    :visible.sync="visible"
    append-to-body
    width="900px">
    <div class="presale-upload-dialog">
      <el-alert
        :title="tipText"
        type="info"
        :closable="false"
        show-icon>
      </el-alert>

      <el-upload
        class="upload-box"
        drag
        action=""
        :auto-upload="false"
        :show-file-list="true"
        :http-request="handleRequest"
        :before-upload="beforeUpload"
        :on-change="handleChange"
        :on-remove="handleRemove"
        :file-list="fileList"
        :multiple="allowMultipleFiles"
        :limit="uploadLimit"
        :accept="acceptTypes">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div slot="tip" class="el-upload__tip">{{ fileTip }}</div>
      </el-upload>

      <div class="action-bar">
        <el-button type="primary" :loading="loading" @click="submitUpload()">{{ actionButtonText }}</el-button>
        <el-button @click="visible = false">关闭</el-button>
      </div>

      <div v-if="resultData" class="result-box">
        <el-descriptions :column="2" border size="small">
          <template v-if="isArchiveUpload">
            <el-descriptions-item label="归档类型">{{ uploadType === 'customs' ? '报关单' : '检疫证明' }}</el-descriptions-item>
            <el-descriptions-item label="归档原件">{{ resultData.filePath || '-' }}</el-descriptions-item>
            <el-descriptions-item label="文件名称">{{ resultData.fileName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ resultData.updateTime || resultData.createTime || '-' }}</el-descriptions-item>
            <template v-if="uploadType === 'customs'">
              <el-descriptions-item label="识别毛重(KG)">{{ resultData.recognizedGrossWeight || '-' }}</el-descriptions-item>
              <el-descriptions-item label="确认毛重(KG)">
                <el-input-number
                  v-model="resultData.confirmedGrossWeight"
                  :precision="3"
                  :min="0"
                  :controls="false"
                  size="mini"
                  style="width: 180px;">
                </el-input-number>
              </el-descriptions-item>
            </template>
            <template v-if="uploadType === 'quarantine'">
              <el-descriptions-item label="识别检疫证日期">{{ resultData.recognizedQuarantineDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="确认检疫证日期">
                <el-date-picker
                  v-model="resultData.confirmedQuarantineDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  size="mini"
                  style="width: 180px;">
                </el-date-picker>
              </el-descriptions-item>
            </template>
          </template>
          <template v-else>
            <el-descriptions-item label="识别类型">{{ resultData.docType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="归档原件">{{ resultData.savedFilePath || '-' }}</el-descriptions-item>
            <template v-if="uploadType === 'packing'">
              <el-descriptions-item label="合同号">{{ ((resultData.packingDraft || {}).contractNo) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="柜号">{{ ((resultData.packingDraft || {}).containerNo) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="保质期天数">{{ ((resultData.packingDraft || {}).shelfLifeDays) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="总箱数">{{ ((resultData.packingDraft || {}).totalBoxes) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="总重量(KG)">{{ ((resultData.packingDraft || {}).totalWeight) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="明细行数">{{ ((resultData.packingDraft || {}).itemList || []).length }}</el-descriptions-item>
            </template>
            <template v-else>
              <el-descriptions-item label="识别阶段">{{ ((resultData.orderDraft || {}).docStage) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="合同号">{{ ((resultData.orderDraft || {}).contractNo) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="柜号">{{ ((resultData.orderDraft || {}).containerNo) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="客户/采购方">{{ ((resultData.orderDraft || {}).partnerName) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="品牌方">{{ ((resultData.orderDraft || {}).brandName) || '-' }}</el-descriptions-item>
              <el-descriptions-item label="明细行数">{{ ((resultData.orderDraft || {}).itemList || []).length }}</el-descriptions-item>
            </template>
          </template>
        </el-descriptions>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button v-if="!isArchiveUpload" type="primary" :disabled="!resultData" @click="confirmHandle()">带入编辑</el-button>
      <el-button v-else-if="uploadType === 'customs'" type="primary" :loading="loading" :disabled="!resultData" @click="confirmCustomsUpload()">确认覆盖保存</el-button>
      <el-button v-else-if="uploadType === 'quarantine'" type="primary" :loading="loading" :disabled="!resultData" @click="confirmQuarantineUpload()">确认保存</el-button>
      <el-button v-else type="primary" :disabled="!resultData" @click="visible = false">完成</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    uploadType: {
      type: String,
      default: 'estimate'
    },
    orderId: {
      type: [Number, String],
      default: 0
    },
    confirmId: {
      type: [Number, String],
      default: 0
    }
  },
  data () {
    return {
      visible: false,
      loading: false,
      fileList: [],
      resultData: null,
      pendingCustomsFile: null,
      pendingQuarantineFiles: []
    }
  },
  computed: {
    isArchiveUpload () {
      return this.uploadType === 'customs' || this.uploadType === 'quarantine'
    },
    allowMultipleFiles () {
      return this.uploadType === 'packing' || this.uploadType === 'quarantine'
    },
    uploadLimit () {
      return this.allowMultipleFiles ? 20 : 1
    },
    dialogTitle () {
      if (this.uploadType === 'confirm') return '上传客户订单确认函'
      if (this.uploadType === 'packing') return '上传装箱单'
      if (this.uploadType === 'customs') return '识别报关单'
      if (this.uploadType === 'quarantine') return '上传检疫证明'
      return '上传预售销售单'
    },
    tipText () {
      if (this.uploadType === 'confirm') {
        return '上传客户订单确认函/付款通知书，识别后带入“客户订单确认函”页签，可人工核对修改。'
      }
      if (this.uploadType === 'packing') {
        return '可同时上传多张装箱单 PDF/图片，识别后带入“装箱单”页签，系统会合并提取总箱数、总重量、保质期和生产日期分布。'
      }
      if (this.uploadType === 'customs') {
        return '上传报关单原件后，系统会先识别毛重；请核对确认毛重后再覆盖保存归档。'
      }
      if (this.uploadType === 'quarantine') {
        return '上传检疫证明原件，系统会识别检疫证日期；请核对确认日期后再保存归档。'
      }
      return '上传预售销售单 PDF，识别后带入“预售销售单”页签，用户修改后保存，原始记录会长期保留。'
    },
    actionButtonText () {
      if (this.uploadType === 'confirm') return '识别客户订单确认函'
      if (this.uploadType === 'packing') return '识别装箱单'
      if (this.uploadType === 'customs') return '上传报关单'
      if (this.uploadType === 'quarantine') return '上传检疫证明'
      return '识别预售销售单'
    },
    acceptTypes () {
      if (this.isArchiveUpload) {
        return '.jpg,.jpeg,.png,.jfif,.bmp,.pdf,.xls,.xlsx,.doc,.docx'
      }
      return '.jpg,.jpeg,.png,.jfif,.bmp,.pdf'
    },
    fileTip () {
      if (this.uploadType === 'confirm') {
        return '支持 JPG / PNG / JFIF / BMP / PDF，当前主要用于客户订单确认函与付款通知书。'
      }
      if (this.uploadType === 'packing') {
        return '支持 JPG / PNG / JFIF / BMP / PDF，可一次选择多张装箱单。'
      }
      if (this.uploadType === 'customs') {
        return '支持 JPG / PNG / JFIF / BMP / PDF / XLS / XLSX / DOC / DOCX，当前用于报关单归档和毛重识别。'
      }
      if (this.uploadType === 'quarantine') {
        return '支持 JPG / PNG / JFIF / BMP / PDF / XLS / XLSX / DOC / DOCX，当前用于检疫证明归档。'
      }
      return '支持 JPG / PNG / JFIF / BMP / PDF，当前主要用于预售销售单。'
    }
  },
  methods: {
    init () {
      this.visible = true
      this.loading = false
      this.fileList = []
      this.resultData = null
      this.pendingCustomsFile = null
      this.pendingQuarantineFiles = []
    },
    beforeUpload (file) {
      const allow = this.isArchiveUpload
        ? /\.(jpg|jpeg|png|jfif|bmp|pdf|xls|xlsx|doc|docx)$/i.test(file.name)
        : /\.(jpg|jpeg|png|jfif|bmp|pdf)$/i.test(file.name)
      if (!allow) {
        this.$message.error(this.isArchiveUpload
          ? '仅支持 jpg/jpeg/png/jfif/bmp/pdf/xls/xlsx/doc/docx 文件'
          : '仅支持 jpg/jpeg/png/jfif/bmp/pdf 文件')
      }
      return allow
    },
    handleChange (file, fileList) {
      this.fileList = this.allowMultipleFiles ? fileList : fileList.slice(-1)
    },
    handleRemove (file, fileList) {
      this.fileList = fileList
    },
    submitUpload () {
      if (!this.fileList.length) {
        this.$message.error('请先选择文件')
        return
      }
      if (this.uploadType === 'customs') {
        const files = this.fileList.map(item => item.raw || item).filter(Boolean)
        this.recognizeCustomsRequest({ files })
      } else if (this.uploadType === 'quarantine') {
        const files = this.fileList.map(item => item.raw || item).filter(Boolean)
        this.recognizeQuarantineRequest({ files })
      } else if (this.isArchiveUpload) {
        const files = this.fileList.map(item => item.raw || item).filter(Boolean)
        this.uploadArchiveRequest({ files })
      } else {
        const files = this.fileList.map(item => item.raw || item).filter(Boolean)
        this.recognizeRequest({ files })
      }
    },
    recognizeQuarantineRequest (option) {
      const files = option.files || (option.file ? [option.file] : [])
      const file = files[0]
      if (!file) return
      this.pendingQuarantineFiles = files
      this.loading = true
      const formData = new FormData()
      formData.append('file', file)
      this.$http({
        url: this.$http.adornUrl('/erp/presale/recognize-quarantine'),
        method: 'post',
        timeout: 1000 * 180,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.resultData = data.attachment || {}
          this.resultData.recognizedQuarantineDate = this.normalizeDateOnly(this.resultData.recognizedQuarantineDate)
          this.resultData.confirmedQuarantineDate = this.normalizeDateOnly(this.resultData.confirmedQuarantineDate)
          if (!this.resultData.recognizedQuarantineDate) {
            this.$message.warning('未识别到检疫证日期，请人工选择确认日期后再保存')
          }
        } else {
          this.$message.error((data && data.msg) || '检疫证明识别失败')
        }
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.$message.error('检疫证明识别失败，请检查文件或后端服务')
      })
    },
    handleRequest () {},
    recognizeCustomsRequest (option) {
      const files = option.files || (option.file ? [option.file] : [])
      const file = files[0]
      if (!file) return
      this.pendingCustomsFile = file
      this.loading = true
      const formData = new FormData()
      formData.append('file', file)
      this.$http({
        url: this.$http.adornUrl('/erp/presale/recognize-customs'),
        method: 'post',
        timeout: 1000 * 180,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.resultData = data.attachment || {}
          if (!this.resultData.recognizedGrossWeight) {
            this.$message.warning('未识别到毛重，请人工填写确认毛重后再保存')
          }
        } else {
          this.$message.error((data && data.msg) || '报关单识别失败')
        }
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.$message.error('报关单识别失败，请检查文件或后端服务')
      })
    },
    recognizeRequest (option) {
      const files = option.files || (option.file ? [option.file] : [])
      if (!files.length) return
      this.loading = true
      const formData = new FormData()
      if (files.length === 1) {
        formData.append('file', files[0])
      } else {
        files.forEach(file => formData.append('files', file))
      }
      formData.append('orderTypeHint', this.uploadType === 'confirm' ? 'PURCHASE' : (this.uploadType === 'packing' ? 'PACKING' : 'SALE'))
      this.$http({
        url: this.$http.adornUrl('/erp/ocr/recognize'),
        method: 'post',
        timeout: 1000 * 180,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.resultData = data.result
        } else {
          this.$message.error((data && data.msg) || '识别失败')
        }
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.$message.error('识别失败，请检查文件或后端服务')
      })
    },
    uploadArchiveRequest (option) {
      const files = (option.files || [option.file]).filter(Boolean)
      if (!files.length) return
      if (!this.orderId) {
        this.$message.error('请先保存预销售单后再上传附件')
        return
      }
      this.loading = true
      const requests = files.map((file, index) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('presaleOrderId', this.orderId)
        if (this.confirmId) {
          formData.append('confirmId', this.confirmId)
        }
        formData.append('attachmentType', this.uploadType === 'customs' ? 'CUSTOMS' : 'QUARANTINE')
        formData.append('overwriteExisting', index === 0 ? 'true' : 'false')
        if (this.uploadType === 'customs' && option.confirmedGrossWeight !== undefined && option.confirmedGrossWeight !== null) {
          formData.append('confirmedGrossWeight', option.confirmedGrossWeight)
        }
        if (this.uploadType === 'quarantine' && option.confirmedQuarantineDate) {
          formData.append('confirmedQuarantineDate', this.normalizeDateOnly(option.confirmedQuarantineDate))
        }
        return this.$http({
          url: this.$http.adornUrl('/erp/presale/upload-attachment'),
          method: 'post',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      })
      Promise.all(requests).then(responses => {
        const failed = responses.find(({ data }) => !data || data.code !== 0)
        if (!failed) {
          const attachments = responses.map(({ data }) => data.attachment || {})
          this.resultData = this.allowMultipleFiles ? attachments : (attachments[0] || {})
          this.$message.success(this.allowMultipleFiles ? `已上传 ${attachments.length} 个检疫证明` : (this.uploadType === 'customs' ? '报关单上传成功' : '检疫证明上传成功'))
          this.$emit('uploaded', this.resultData)
          this.visible = false
        } else {
          this.$message.error((failed.data && failed.data.msg) || '上传失败')
        }
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.$message.error('上传失败，请检查文件或后端服务')
      })
    },
    confirmHandle () {
      this.$emit('recognized', this.resultData)
      this.visible = false
    },
    confirmCustomsUpload () {
      if (!this.pendingCustomsFile) {
        this.$message.error('请先识别报关单文件')
        return
      }
      if (this.resultData && (this.resultData.confirmedGrossWeight === undefined || this.resultData.confirmedGrossWeight === null || this.resultData.confirmedGrossWeight === '')) {
        this.$message.error('请填写确认毛重')
        return
      }
      this.uploadArchiveRequest({
        files: [this.pendingCustomsFile],
        confirmedGrossWeight: this.resultData.confirmedGrossWeight
      })
    },
    confirmQuarantineUpload () {
      if (!this.pendingQuarantineFiles.length) {
        this.$message.error('请先识别检疫证明文件')
        return
      }
      if (!this.resultData || !this.resultData.confirmedQuarantineDate) {
        this.$message.error('请选择确认检疫证日期')
        return
      }
      this.uploadArchiveRequest({
        files: this.pendingQuarantineFiles,
        confirmedQuarantineDate: this.normalizeDateOnly(this.resultData.confirmedQuarantineDate)
      })
    },
    normalizeDateOnly (value) {
      if (!value) {
        return ''
      }
      if (typeof value === 'string') {
        return value.length >= 10 ? value.substring(0, 10) : value
      }
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        return ''
      }
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${date.getFullYear()}-${month}-${day}`
    }
  }
}
</script>

<style scoped>
.presale-upload-dialog .upload-box {
  margin-top: 15px;
}

.presale-upload-dialog .action-bar {
  margin: 15px 0;
}

.presale-upload-dialog .result-box {
  margin-top: 10px;
}
</style>
