USE qlns;

-- Cau hinh ky luong can seed
SET @thang = 5;
SET @nam = 2026;
SET @so_ngay_cong_chuan = 26.0;

-- Seed bang luong cho nhan vien dang lam, tranh tao trung theo thang/nam
INSERT INTO luong (
  nhan_vien_id,
  thang,
  nam,
  luong_co_ban,
  phu_cap,
  thuong,
  phat,
  bao_hiem,
  thue,
  luong_thuc_te,
  ghi_chu,
  trang_thai,
  ngay_tra_luong
)
SELECT
  s.id AS nhan_vien_id,
  @thang AS thang,
  @nam AS nam,
  s.basic_salary AS luong_co_ban,
  s.allowance AS phu_cap,
  s.bonus AS thuong,
  s.penalty AS phat,
  s.insurance AS bao_hiem,
  s.tax AS thue,
  ROUND((((s.basic_salary / @so_ngay_cong_chuan) * @so_ngay_cong_chuan) * 1.0) + s.allowance + s.bonus + s.penalty - s.insurance - s.tax, 2) AS luong_thuc_te,
  CONCAT('Seed payroll ', LPAD(@thang, 2, '0'), '/', @nam, ' | PaymentStatus=Cho duyet') AS ghi_chu,
  'Chưa trả' AS trang_thai,
  NULL AS ngay_tra_luong
FROM (
  SELECT
    n.id,
    n.ho_ten,
    CASE
      WHEN COALESCE(n.luong_co_ban, 0) > 0 THEN n.luong_co_ban
      WHEN n.vai_tro = 'Admin' THEN 30000000
      WHEN n.chuc_vu LIKE '%Giám đốc%' OR n.chuc_vu LIKE '%Giam doc%' THEN 25000000
      WHEN n.chuc_vu LIKE '%Trưởng phòng%' OR n.chuc_vu LIKE '%Truong phong%' THEN 18000000
      WHEN n.chuc_vu LIKE '%Nhân viên%' OR n.chuc_vu LIKE '%Nhan vien%' THEN 12000000
      ELSE 8000000
    END AS basic_salary,
    CASE
      WHEN n.vai_tro = 'Admin' THEN 3000000
      WHEN n.chuc_vu LIKE '%Giám đốc%' OR n.chuc_vu LIKE '%Giam doc%' THEN 2500000
      WHEN n.chuc_vu LIKE '%Trưởng phòng%' OR n.chuc_vu LIKE '%Truong phong%' THEN 1500000
      ELSE 800000
    END AS allowance,
    0 AS bonus,
    0 AS penalty,
    CASE
      WHEN n.vai_tro = 'Admin' THEN 1200000
      ELSE 800000
    END AS insurance,
    0 AS tax
  FROM nhanvien n
  WHERE n.trang_thai_lam_viec = 'Đang làm'
) s
WHERE NOT EXISTS (
  SELECT 1
  FROM luong l
  WHERE l.nhan_vien_id = s.id
    AND l.thang = @thang
    AND l.nam = @nam
);

-- Kiem tra nhanh ket qua ky luong vua seed
SELECT
  id,
  nhan_vien_id,
  thang,
  nam,
  luong_co_ban,
  phu_cap,
  thuong,
  phat,
  bao_hiem,
  thue,
  luong_thuc_te,
  trang_thai,
  ghi_chu
FROM luong
WHERE thang = @thang
  AND nam = @nam
ORDER BY nhan_vien_id;
