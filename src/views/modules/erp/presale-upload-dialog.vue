<template>
  <el-dialog
    :title="dialogTitle"
    :close-on-click-modal="false"
    :visible.sync="visible"
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
        :limit="1"
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
    }
  },
  data () {
    return {
      visible: false,
      loading: false,
      fileList: [],
      resultData: null
    }
  },
  computed: {
    isArchiveUpload () {
      return this.uploadType === 'customs' || this.uploadType === 'quarantine'
    },
    dialogTitle () {
      if (this.uploadType === 'confirm') return '上传客户订单确认函'
      if (this.uploadType === 'packing') return '上传装箱单'
      if (this.uploadType === 'customs') return '上传报关单'
      if (this.uploadType === 'quarantine') return '上传检疫证明'
      return '上传预售销售单'
    },
    tipText () {
      if (this.uploadType === 'confirm') {
        return '上传客户订单确认函/付款通知书，识别后带入“客户订单确认函”页签，可人工核对修改。'
      }
      if (this.uploadType === 'packing') {
        return '上传装箱单 PDF，识别后带入“装箱单”页签，系统会提取总箱数、总重量、保质期和生产日期分布。'
      }
      if (this.uploadType === 'customs') {
        return '上传报关单原件，系统仅做归档存储，不进行 OCR 识别。'
      }
      if (this.uploadType === 'quarantine') {
        return '上传检疫证明原件，系统仅做归档存储，不进行 OCR 识别。'
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
        return '支持 JPG / PNG / JFIF / BMP / PDF，当前主要用于装箱单。'
      }
      if (this.uploadType === 'customs') {
        return '支持 JPG / PNG / JFIF / BMP / PDF / XLS / XLSX / DOC / DOCX，当前用于报关单归档。'
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
      this.fileList = fileList.slice(-1)
    },
    handleRemove (file, fileList) {
      this.fileList = fileList
    },
    submitUpload () {
      if (!this.fileList.length) {
        this.$message.error('请先选择文件')
        return
      }
      const file = this.fileList[0].raw || this.fileList[0]
      if (this.isArchiveUpload) {
        this.uploadArchiveRequest({ file })
      } else {
        this.recognizeRequest({ file })
      }
    },
    handleRequest () {},
    recognizeRequest (option) {
      const file = option.file
      if (!file) return
      this.loading = true
      const formData = new FormData()
      formData.append('file', file)
      formData.append('orderTypeHint', this.uploadType === 'confirm' ? 'PURCHASE' : (this.uploadType === 'packing' ? 'PACKING' : 'SALE'))
      this.$http({
        url: this.$http.adornUrl('/erp/ocr/recognize'),
        method: 'post',
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
      const file = option.file
      if (!file) return
      if (!this.orderId) {
        this.$message.error('请先保存预销售单后再上传附件')
        return
      }
      this.loading = true
      const formData = new FormData()
      formData.append('file', file)
      formData.append('presaleOrderId', this.orderId)
      formData.append('attachmentType', this.uploadType === 'customs' ? 'CUSTOMS' : 'QUARANTINE')
      this.$http({
        url: this.$http.adornUrl('/erp/presale/upload-attachment'),
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.resultData = data.attachment || {}
          this.$message.success(this.uploadType === 'customs' ? '报关单上传成功' : '检疫证明上传成功')
          this.$emit('uploaded', this.resultData)
          this.visible = false
        } else {
          this.$message.error((data && data.msg) || '上传失败')
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
