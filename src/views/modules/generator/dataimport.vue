<template>
  <div class="mod-dataimport">
    <el-form :inline="true">
      <el-form-item>
        <el-upload
          v-if="isAuth('generator:dataimport:save')"
          class="upload-btn"
          :action="importUrl"
          :show-file-list="false"
          :before-upload="beforeUploadHandle"
          :on-success="uploadSuccessHandle"
          :on-error="uploadErrorHandle"
          accept=".xls,.xlsx">
          <el-button type="primary">导入 Excel</el-button>
        </el-upload>
        <el-button icon="el-icon-refresh" @click="getDataList()">刷新</el-button>
        <el-button
          v-if="isAuth('generator:dataimport:delete')"
          type="danger"
          @click="deleteHandle()"
          :disabled="dataListSelections.length <= 0">批量删除</el-button>
      </el-form-item>
    </el-form>

    <el-alert
      title="当前页面按后端接口恢复，支持分页查看、查看详情、编辑已有数据、删除与 Excel 导入。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-table
      :data="dataList"
      border
      stripe
      v-loading="dataListLoading"
      @selection-change="selectionChangeHandle"
      style="width: 100%; margin-top: 15px;">
      <el-table-column
        type="selection"
        header-align="center"
        align="center"
        width="50">
      </el-table-column>
      <el-table-column
        prop="id"
        label="ID"
        width="80"
        header-align="center"
        align="center">
      </el-table-column>
      <el-table-column
        v-for="column in tableColumns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :min-width="column.minWidth"
        show-overflow-tooltip
        header-align="center"
        align="center">
      </el-table-column>
      <el-table-column
        fixed="right"
        label="操作"
        width="180"
        header-align="center"
        align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="detailHandle(scope.row.id, true)">查看</el-button>
          <el-button
            v-if="isAuth('generator:dataimport:update')"
            type="text"
            size="small"
            @click="detailHandle(scope.row.id, false)">修改</el-button>
          <el-button
            v-if="isAuth('generator:dataimport:delete')"
            type="text"
            size="small"
            @click="deleteHandle(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>

    <add-or-update
      v-if="addOrUpdateVisible"
      ref="addOrUpdate"
      @refreshDataList="getDataList">
    </add-or-update>
  </div>
</template>

<script>
  import AddOrUpdate from './dataimport-add-or-update'
  import { TABLE_COLUMNS } from './dataimport-fields'

  export default {
    data () {
      return {
        dataList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false,
        dataListSelections: [],
        addOrUpdateVisible: false,
        importUrl: '',
        tableColumns: TABLE_COLUMNS
      }
    },
    components: {
      AddOrUpdate
    },
    activated () {
      this.importUrl = this.$http.adornUrl(`/generator/dataimport/dynamicImportExcel?token=${this.$cookie.get('token')}`)
      this.getDataList()
    },
    methods: {
      getDataList () {
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl('/generator/dataimport/list'),
          method: 'get',
          params: this.$http.adornParams({
            page: this.pageIndex,
            limit: this.pageSize
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataList = data.page.list
            this.totalPage = data.page.totalCount
          } else {
            this.dataList = []
            this.totalPage = 0
            this.$message.error(data.msg || '获取列表失败')
          }
          this.dataListLoading = false
        }).catch(() => {
          this.dataListLoading = false
        })
      },
      sizeChangeHandle (val) {
        this.pageSize = val
        this.pageIndex = 1
        this.getDataList()
      },
      currentChangeHandle (val) {
        this.pageIndex = val
        this.getDataList()
      },
      selectionChangeHandle (val) {
        this.dataListSelections = val
      },
      detailHandle (id, readonly) {
        this.addOrUpdateVisible = true
        this.$nextTick(() => {
          this.$refs.addOrUpdate.init(id, readonly)
        })
      },
      beforeUploadHandle (file) {
        const isExcel = /\.(xls|xlsx)$/i.test(file.name)
        if (!isExcel) {
          this.$message.error('请上传 Excel 文件')
          return false
        }
        return true
      },
      uploadSuccessHandle (response) {
        if (response && response.code === 0) {
          this.$message({
            message: '导入成功',
            type: 'success',
            duration: 1500,
            onClose: () => {
              this.pageIndex = 1
              this.getDataList()
            }
          })
        } else {
          this.$message.error((response && response.msg) || '导入失败')
        }
      },
      uploadErrorHandle () {
        this.$message.error('导入失败，请检查文件或后台服务')
      },
      deleteHandle (id) {
        const ids = id ? [id] : this.dataListSelections.map(item => item.id)
        this.$confirm(`确定对[id=${ids.join(',')}]进行[${id ? '删除' : '批量删除'}]操作?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$http({
            url: this.$http.adornUrl('/generator/dataimport/delete'),
            method: 'post',
            data: this.$http.adornData(ids, false)
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.$message({
                message: '操作成功',
                type: 'success',
                duration: 1500,
                onClose: () => {
                  this.getDataList()
                }
              })
            } else {
              this.$message.error(data.msg || '删除失败')
            }
          })
        }).catch(() => {})
      }
    }
  }
</script>

<style scoped>
  .mod-dataimport .upload-btn {
    display: inline-block;
    margin-right: 10px;
  }

  .mod-dataimport .el-pagination {
    margin-top: 15px;
    text-align: right;
  }
</style>
