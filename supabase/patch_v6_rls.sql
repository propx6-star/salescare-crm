-- PATCH V6: Cập nhật cơ sở dữ liệu để hỗ trợ Phân quyền 1-1 cho Nhân viên và Cửa hàng

-- 1. Thêm cột shop_id trực tiếp vào bảng user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS shop_id BIGINT REFERENCES public.shops(id);

-- 2. Cập nhật lại Hàm kiểm tra quyền truy cập (Dùng trực tiếp shop_id thay vì bảng trung gian)
CREATE OR REPLACE FUNCTION public.user_has_shop_access(check_shop_id BIGINT)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND (shop_id = check_shop_id OR role = 'SUPER_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Sửa lỗi RLS cho bảng shops (Cho phép xem và cấp quyền thêm, sửa, xóa cho SUPER_ADMIN)
DROP POLICY IF EXISTS "Users can view shops" ON public.shops;
DROP POLICY IF EXISTS "SUPER_ADMIN can insert shops" ON public.shops;
DROP POLICY IF EXISTS "SUPER_ADMIN can update shops" ON public.shops;
DROP POLICY IF EXISTS "SUPER_ADMIN can delete shops" ON public.shops;

-- Ai cũng thấy danh sách shop (để chọn)
CREATE POLICY "Users can view shops" ON public.shops
FOR SELECT USING (true);

-- CHỈ SUPER_ADMIN được phép tạo/sửa/xóa Chi nhánh
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
