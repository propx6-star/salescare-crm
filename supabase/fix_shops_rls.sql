-- Sửa lỗi RLS cho bảng shops

-- 1. Xóa các policy cũ nếu có
DROP POLICY IF EXISTS "Users can view their own shop" ON public.shops;
DROP POLICY IF EXISTS "SUPER_ADMIN can manage shops" ON public.shops;
DROP POLICY IF EXISTS "Anyone can view active shops" ON public.shops;

-- 2. Tạo Policy cho phép mọi user đăng nhập có thể XEM (SELECT) danh sách Chi nhánh (để phân quyền hoặc chọn chi nhánh)
-- Ở đây cho phép đọc tất cả các shop (SUPER_ADMIN cần thấy hết, STAFF cũng cần thấy khi đăng nhập để map shop name)
CREATE POLICY "Users can view shops" ON public.shops
FOR SELECT USING (true);

-- 3. Tạo Policy cho phép CHỈ SUPER_ADMIN được phép THÊM, SỬA, XÓA Chi nhánh
CREATE POLICY "SUPER_ADMIN can insert shops" ON public.shops
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

CREATE POLICY "SUPER_ADMIN can update shops" ON public.shops
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

CREATE POLICY "SUPER_ADMIN can delete shops" ON public.shops
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);
