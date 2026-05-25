-- PATCH V8: Bổ sung các cột còn thiếu cho bảng customers

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expected_repurchase_date TIMESTAMP WITH TIME ZONE;

-- Xóa schema cache để PostgREST nhận diện các cột mới
NOTIFY pgrst, 'reload schema';
