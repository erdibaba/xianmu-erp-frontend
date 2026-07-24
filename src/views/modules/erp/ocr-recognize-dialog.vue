<template>
  <el-dialog
    title="OCR Import"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="900px">
    <div class="ocr-recognize-dialog">
      <el-alert
        title="Upload an image or PDF, generate a draft order, then review and edit before saving."
        type="info"
        :closable="false"
        show-icon>
      </el-alert>

      <el-upload
        ref="uploader"
        class="upload-box"
        drag
        action=""
        :auto-upload="false"
        :show-file-list="true"
        :http-request="recognizeRequest"
        :before-upload="beforeUpload"
        :on-change="handleChange"
        :on-remove="handleRemove"
        :file-list="fileList"
        :limit="1"
        accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">Drop file here, or <em>click to upload</em></div>
        <div slot="tip" class="el-upload__tip">Supported: JPG / PNG / JFIF / BMP / PDF</div>
      </el-upload>

      <div class="action-bar">
        <el-button type="primary" :loading="loading" @click="submitUpload()">Run OCR</el-button>
        <el-button @click="visible = false">Close</el-button>
      </div>

      <div v-if="recognizedResult" class="result-box">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never">
              <div slot="header">Draft Summary</div>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="Doc Type">{{ recognizedResult.docType || orderType }}</el-descriptions-item>
                <el-descriptions-item label="Doc Stage">{{ ((recognizedResult.orderDraft || {}).docStage) || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Order Source">{{ ((recognizedResult.orderDraft || {}).orderSource) || ((recognizedResult.orderDraft || {}).sourceType) || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Partner">{{ (recognizedResult.orderDraft || {}).partnerName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Contract No">{{ (recognizedResult.orderDraft || {}).contractNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Container">{{ (recognizedResult.orderDraft || {}).containerNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Warehouse">{{ (recognizedResult.orderDraft || {}).warehouseName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Items">{{ ((recognizedResult.orderDraft || {}).itemList || []).length }}</el-descriptions-item>
                <el-descriptions-item label="Archived File">{{ recognizedResult.savedFilePath || '-' }}</el-descriptions-item>
              </el-descriptions>

              <el-table
                :data="(recognizedResult.orderDraft || {}).itemList || []"
                border
                size="mini"
                style="margin-top: 15px;">
                <el-table-column prop="productCode" label="Code" min-width="110"></el-table-column>
                <el-table-column prop="productName" label="Name" min-width="160" show-overflow-tooltip></el-table-column>
                <el-table-column prop="quantity" label="Qty" width="90" align="right"></el-table-column>
                <el-table-column prop="unitPrice" label="Price" width="90" align="right"></el-table-column>
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <div slot="header">Raw Text</div>
              <div class="raw-text">{{ recognizedResult.rawText || '' }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">Cancel</el-button>
      <el-button type="primary" :disabled="!recognizedResult || !recognizedResult.orderDraft" @click="useDraftHandle()">Use Draft</el-button>
    </span>
  </el-dialog>
</template>

<script>
  export default {
    props: {
      orderType: {
        type: String,
        default: 'PURCHASE'
      }
    },
    data () {
      return {
        visible: false,
        loading: false,
        fileList: [],
        recognizedResult: null
      }
    },
    methods: {
      init () {
        this.visible = true
        this.loading = false
        this.fileList = []
        this.recognizedResult = null
      },
      beforeUpload (file) {
        const allow = /\.(jpg|jpeg|png|jfif|bmp|pdf)$/i.test(file.name)
        if (!allow) {
          this.$message.error('Only jpg/jpeg/png/jfif/bmp/pdf are supported')
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
          this.$message.error('Please choose a document first')
          return
        }
        this.recognizeRequest({ file: this.fileList[0].raw || this.fileList[0] })
      },
      recognizeRequest (option) {
        const file = option.file
        if (!file) {
          return
        }
        this.loading = true
        const formData = new FormData()
        formData.append('file', file)
        formData.append('orderTypeHint', this.orderType)
        this.$http({
          url: this.$http.adornUrl('/erp/ocr/recognize'),
          method: 'post',
          timeout: 1000 * 60 * 15,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.recognizedResult = data.result
            if (!this.recognizedResult || !this.recognizedResult.orderDraft) {
              this.$message.warning('OCR finished, but no usable draft was returned')
            }
          } else {
            this.$message.error(data.msg || 'OCR failed')
          }
          this.loading = false
        }).catch(() => {
          this.loading = false
          this.$message.error('OCR failed, please check the file or backend service')
        })
      },
      useDraftHandle () {
        this.$emit('recognized', this.recognizedResult.orderDraft)
        this.visible = false
      }
    }
  }
</script>

<style scoped>
  .ocr-recognize-dialog .upload-box {
    margin-top: 15px;
  }

  .ocr-recognize-dialog .action-bar {
    margin: 15px 0;
  }

  .ocr-recognize-dialog .result-box {
    margin-top: 10px;
  }

  .ocr-recognize-dialog .raw-text {
    max-height: 420px;
    overflow: auto;
    white-space: pre-wrap;
    line-height: 1.7;
    color: #606266;
  }
</style>
