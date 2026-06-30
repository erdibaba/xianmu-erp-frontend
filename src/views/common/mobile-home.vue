<template>
  <div class="mobile-home-page">
    <div class="mobile-home-shell">
      <div class="mobile-home-hero">
        <img src="~@/assets/img/xianmu-logo.png" alt="鲜牧ERP系统">
        <div>
          <p>鲜牧ERP</p>
          <h2>手机工作台</h2>
        </div>
      </div>

      <div v-loading="loading" class="mobile-menu-grid">
        <el-empty v-if="!loading && !mobileMenus.length" description="暂无手机端菜单，请联系管理员配置权限"></el-empty>
        <button v-for="item in mobileMenus" :key="item.menuId" class="mobile-menu-card" @click="goMenu(item)">
          <span class="mobile-menu-card__icon">
            <i v-if="isClassIcon(item.mobileIcon || item.icon)" :class="item.mobileIcon || item.icon"></i>
            <icon-svg v-else :name="item.mobileIcon || item.icon || 'menu'"></icon-svg>
          </span>
          <span class="mobile-menu-card__title">{{ item.mobileTitle || item.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        loading: false,
        mobileMenus: []
      }
    },
    created () {
      this.loadMenus()
    },
    methods: {
      loadMenus () {
        this.loading = true
        this.$http({
          url: this.$http.adornUrl('/sys/menu/nav'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            const menus = this.flattenMenus(data.menuList || [])
            this.mobileMenus = menus.filter(item => Number(item.mobileVisible) === 1)
          } else {
            this.mobileMenus = []
            this.$message.error((data && data.msg) || '获取手机菜单失败')
          }
        }).finally(() => {
          this.loading = false
        })
      },
      flattenMenus (menus) {
        return menus.reduce((result, item) => {
          result.push(item)
          if (item.list && item.list.length) {
            result = result.concat(this.flattenMenus(item.list))
          }
          return result
        }, [])
      },
      isClassIcon (icon) {
        return !!icon && (/^el-icon-/.test(icon) || /^fa\s/.test(icon))
      },
      goMenu (item) {
        const target = item.mobileUrl || item.url
        if (!target) {
          return
        }
        if (/^http[s]?:\/\//.test(target)) {
          window.location.href = target
          return
        }
        const path = target.charAt(0) === '/' ? target : `/${target.replace('/', '-')}`
        this.$router.push(path)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .mobile-home-page {
    min-height: 100vh;
    box-sizing: border-box;
    padding: 18px;
    background:
      radial-gradient(circle at 8% 4%, rgba(62, 161, 73, .22), transparent 32%),
      linear-gradient(160deg, #eef7f3 0%, #f7fbff 46%, #fff8ea 100%);
  }
  .mobile-home-shell {
    max-width: 560px;
    margin: 0 auto;
  }
  .mobile-home-hero {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 16px;
    margin-bottom: 18px;
    background: #fff;
    border-radius: 22px;
    box-shadow: 0 16px 40px rgba(7, 20, 82, .08);
    img {
      width: 84px;
      height: 54px;
      object-fit: contain;
    }
    p {
      margin: 0 0 4px;
      color: #1d8c68;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    h2 {
      margin: 0;
      color: #071452;
      font-size: 24px;
      font-weight: 800;
    }
  }
  .mobile-menu-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    min-height: 220px;
  }
  .mobile-menu-card {
    min-height: 124px;
    padding: 18px 12px;
    color: #071452;
    text-align: center;
    background: #fff;
    border: 0;
    border-radius: 24px;
    box-shadow: 0 18px 36px rgba(7, 20, 82, .1);
    &__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      margin-bottom: 12px;
      color: #fff;
      font-size: 26px;
      background: linear-gradient(135deg, #06135a, #1d8c68);
      border-radius: 18px;
      i,
      svg {
        width: 1em;
        height: 1em;
      }
    }
    &__title {
      display: block;
      font-size: 16px;
      font-weight: 800;
    }
  }
  @media (max-width: 420px) {
    .mobile-home-page {
      padding: 14px;
    }
    .mobile-menu-card {
      min-height: 112px;
    }
  }
</style>
