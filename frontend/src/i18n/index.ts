import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      dashboard: 'Dashboard',
      management: 'Management',
      system: 'System',
      analytics: 'Analytics',
      pageManagement: 'Page Management',
      
      // Menu items
      categories: 'Categories',
      products: 'Products',
      orders: 'Orders',
      inventory: 'Inventory',
      customers: 'Customers',
      database: 'Database',
      apiStatus: 'API Status',
      server: 'Server',
      security: 'Security',
      reports: 'Reports',
      logs: 'Logs',
      settings: 'Settings',
      homepage: 'Homepage',
      blog: 'Blog',
      contact: 'Contact',
      googleMap: 'Google Map',
      
      // User menu
      profile: 'Profile',
      helpSupport: 'Help & Support',
      logout: 'Logout',
      
      // Dashboard stats
      totalSales: 'Total Sales',
      recentOrders: 'Recent Orders',
      topProducts: 'Top Products',
      launchPOS: 'Launch POS',
      
      // Login
      login: 'Log in',
      email: 'Email',
      password: 'Password',
      testAccount: 'Test Account',
      loginSuccessful: 'Login successful!',
      loginFailed: 'Login failed',
      
      // Status
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      
      // Common actions
      search: 'Search...',
      language: 'Language',
      notifications: 'Notifications',
      administrator: 'Administrator',
      
      // Validation
      emailRequired: 'Please input your email!',
      emailInvalid: 'Please enter a valid email!',
      passwordRequired: 'Please input your password!',
      
      // Categories page
      totalCategories: 'Total Categories',
      parentCategories: 'Parent Categories',
      subCategories: 'Sub Categories',
      totalProducts: 'Total Products',
      searchCategories: 'Search categories...',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      categoryName: 'Category Name',
      categoryNameVi: 'Category Name (Vietnamese)',
      categoryNameEn: 'Category Name (English)',
      pleaseEnterCategoryName: 'Please enter category name',
      pleaseEnterCategoryNameEn: 'Please enter category name in English',
      slug: 'Slug',
      pleaseEnterSlug: 'Please enter slug',
      description: 'Description',
      enterDescription: 'Enter description',
      parentCategory: 'Parent Category',
      selectParentCategory: 'Select parent category',
      none: 'None',
      icon: 'Icon',
      pleaseEnterIcon: 'Please enter icon',
      enterEmoji: 'Enter emoji icon',
      displayOrder: 'Display Order',
      pleaseEnterOrder: 'Please enter display order',
      enterOrder: 'Enter order',
      status: 'Status',
      pleaseSelectStatus: 'Please select status',
      selectStatus: 'Select status',
      active: 'Active',
      inactive: 'Inactive',
      categoryImage: 'Category Image',
      uploadImage: 'Upload Image',
      confirmDelete: 'Are you sure you want to delete this category?',
      categoryDeleted: 'Category deleted successfully',
      categoryUpdated: 'Category updated successfully',
      categoryAdded: 'Category added successfully',
      gridView: 'Grid View',
      listView: 'List View',
      total: 'Total',
      image: 'Image',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      update: 'Update',
      add: 'Add',
      cancel: 'Cancel',
      yes: 'Yes',
      no: 'No',
      enterCategoryName: 'Enter category name',
      enterCategoryNameEn: 'Enter category name in English',
      enterSlug: 'Enter slug',
      order: 'Order',
      
      // Footer
      documentation: 'Documentation',
    }
  },
  vi: {
    translation: {
      // Common
      dashboard: 'Bảng điều khiển',
      management: 'Quản lý',
      system: 'Hệ thống',
      analytics: 'Phân tích',
      pageManagement: 'Quản lý trang',
      
      // Menu items
      categories: 'Danh mục',
      products: 'Sản phẩm',
      orders: 'Đơn hàng',
      inventory: 'Kho hàng',
      customers: 'Khách hàng',
      database: 'Cơ sở dữ liệu',
      apiStatus: 'Trạng thái API',
      server: 'Máy chủ',
      security: 'Bảo mật',
      reports: 'Báo cáo',
      logs: 'Nhật ký',
      settings: 'Cài đặt',
      homepage: 'Trang chủ',
      blog: 'Bài viết',
      contact: 'Liên hệ',
      googleMap: 'Bản đồ Google',
      
      // User menu
      profile: 'Hồ sơ',
      helpSupport: 'Trợ giúp & Hỗ trợ',
      logout: 'Đăng xuất',
      
      // Dashboard stats
      totalSales: 'Tổng doanh thu',
      recentOrders: 'Đơn hàng gần đây',
      topProducts: 'Sản phẩm bán chạy',
      launchPOS: 'Khởi động POS',
      
      // Login
      login: 'Đăng nhập',
      email: 'Email',
      password: 'Mật khẩu',
      testAccount: 'Tài khoản thử nghiệm',
      loginSuccessful: 'Đăng nhập thành công!',
      loginFailed: 'Đăng nhập thất bại',
      
      // Status
      processing: 'Đang xử lý',
      shipped: 'Đã gửi hàng',
      delivered: 'Đã giao hàng',
      
      // Common actions
      search: 'Tìm kiếm...',
      language: 'Ngôn ngữ',
      notifications: 'Thông báo',
      administrator: 'Quản trị viên',
      
      // Validation
      emailRequired: 'Vui lòng nhập email!',
      emailInvalid: 'Vui lòng nhập email hợp lệ!',
      passwordRequired: 'Vui lòng nhập mật khẩu!',
      
      // Categories page  
      totalCategories: 'Tổng danh mục',
      parentCategories: 'Danh mục cha',
      subCategories: 'Danh mục con',
      totalProducts: 'Tổng sản phẩm',
      searchCategories: 'Tìm kiếm danh mục...',
      addCategory: 'Thêm danh mục',
      editCategory: 'Sửa danh mục',
      categoryName: 'Tên danh mục',
      categoryNameVi: 'Tên danh mục (Tiếng Việt)',
      categoryNameEn: 'Tên danh mục (Tiếng Anh)',
      pleaseEnterCategoryName: 'Vui lòng nhập tên danh mục',
      pleaseEnterCategoryNameEn: 'Vui lòng nhập tên danh mục tiếng Anh',
      slug: 'Đường dẫn',
      pleaseEnterSlug: 'Vui lòng nhập đường dẫn',
      description: 'Mô tả',
      enterDescription: 'Nhập mô tả',
      parentCategory: 'Danh mục cha',
      selectParentCategory: 'Chọn danh mục cha',
      none: 'Không có',
      icon: 'Biểu tượng',
      pleaseEnterIcon: 'Vui lòng nhập biểu tượng',
      enterEmoji: 'Nhập biểu tượng emoji',
      displayOrder: 'Thứ tự hiển thị',
      pleaseEnterOrder: 'Vui lòng nhập thứ tự hiển thị',
      enterOrder: 'Nhập thứ tự',
      status: 'Trạng thái',
      pleaseSelectStatus: 'Vui lòng chọn trạng thái',
      selectStatus: 'Chọn trạng thái',
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      categoryImage: 'Hình ảnh danh mục',
      uploadImage: 'Tải lên hình ảnh',
      confirmDelete: 'Bạn có chắc chắn muốn xóa danh mục này?',
      categoryDeleted: 'Xóa danh mục thành công',
      categoryUpdated: 'Cập nhật danh mục thành công',
      categoryAdded: 'Thêm danh mục thành công',
      gridView: 'Xem dạng lưới',
      listView: 'Xem dạng danh sách',
      total: 'Tổng',
      image: 'Hình ảnh',
      actions: 'Thao tác',
      edit: 'Sửa',
      delete: 'Xóa',
      update: 'Cập nhật',
      add: 'Thêm',
      cancel: 'Hủy',
      yes: 'Có',
      no: 'Không',
      enterCategoryName: 'Nhập tên danh mục',
      enterCategoryNameEn: 'Nhập tên danh mục tiếng Anh',
      enterSlug: 'Nhập đường dẫn',
      order: 'Thứ tự',
      
      // Footer
      documentation: 'Tài liệu',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'vi', // Default to Vietnamese
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;