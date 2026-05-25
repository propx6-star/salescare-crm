-- PATCH V7: Sửa lỗi RLS không cho phép Admin phân quyền cho Nhân viên

-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "SUPER_ADMIN can update profiles" ON public.user_profiles;

-- 1. Cho phép User tự cập nhật thông tin của chính mình
CREATE POLICY "Users can update their own profile" ON public.user_profiles 
FOR UPDATE USING (id = auth.uid());

-- 2. Cho phép SUPER_ADMIN được phép cập nhật tài khoản của TẤT CẢ mọi người (để phân quyền / gắn shop)
CREATE POLICY "SUPER_ADMIN can update profiles" ON public.user_profiles 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);
