CREATE DATABASE IF NOT EXISTS hrm_ics
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hrm_ics;

CREATE TABLE `cau_hinh_he_thong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_cau_hinh` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gia_tri` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cham_cong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhan_vien_id` int DEFAULT NULL,
  `ngay` date DEFAULT NULL,
  `bao_cao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `loai_cham_cong` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'office',
  `trang_thai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Bình thường',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nhan_vien_id` (`nhan_vien_id`,`ngay`),
  CONSTRAINT `cham_cong_ibfk_1` FOREIGN KEY (`nhan_vien_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1163 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cong_viec` (
  `id` int NOT NULL AUTO_INCREMENT,
  `du_an_id` int DEFAULT NULL,
  `ten_cong_viec` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `han_hoan_thanh` date DEFAULT NULL,
  `ngay_gia_han` date DEFAULT NULL,
  `muc_do_uu_tien` enum('Thấp','Trung bình','Cao') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Trung bình',
  `nguoi_giao_id` int DEFAULT NULL,
  `phong_ban_id` int DEFAULT NULL,
  `trang_thai` enum('Chưa bắt đầu','Đang thực hiện','Đã hoàn thành','Trễ hạn') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Chưa bắt đầu',
  `trang_thai_duyet` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Chưa duyệt',
  `ly_do_duyet` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tai_lieu_cv` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_tai_lieu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nhac_viec` int DEFAULT NULL,
  `tinh_trang` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_hoan_thanh` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `nguoi_giao_id` (`nguoi_giao_id`),
  KEY `phong_ban_id` (`phong_ban_id`),
  KEY `fk_cong_viec_du_an` (`du_an_id`),
  CONSTRAINT `cong_viec_ibfk_1` FOREIGN KEY (`nguoi_giao_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cong_viec_ibfk_3` FOREIGN KEY (`phong_ban_id`) REFERENCES `phong_ban` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cong_viec_du_an` FOREIGN KEY (`du_an_id`) REFERENCES `du_an` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=582 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cong_viec_lich_su` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cong_viec_id` int DEFAULT NULL,
  `nguoi_thay_doi_id` int DEFAULT NULL,
  `mo_ta_thay_doi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `thoi_gian` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cong_viec_id` (`cong_viec_id`),
  KEY `nguoi_thay_doi_id` (`nguoi_thay_doi_id`),
  CONSTRAINT `cong_viec_lich_su_ibfk_1` FOREIGN KEY (`cong_viec_id`) REFERENCES `cong_viec` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cong_viec_lich_su_ibfk_2` FOREIGN KEY (`nguoi_thay_doi_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2056 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cong_viec_nguoi_nhan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cong_viec_id` int NOT NULL,
  `nhan_vien_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cong_viec_id` (`cong_viec_id`),
  KEY `nhan_vien_id` (`nhan_vien_id`),
  CONSTRAINT `cong_viec_nguoi_nhan_ibfk_1` FOREIGN KEY (`cong_viec_id`) REFERENCES `cong_viec` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cong_viec_nguoi_nhan_ibfk_2` FOREIGN KEY (`nhan_vien_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2011 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cong_viec_quy_trinh` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cong_viec_id` int DEFAULT NULL,
  `ten_buoc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `trang_thai` enum('Chưa bắt đầu','Đang thực hiện','Đã hoàn thành') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Chưa bắt đầu',
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tai_lieu_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Link tài liệu',
  `tai_lieu_file` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'File tài liệu đính kèm (nhiều file cách nhau bởi ;)',
  PRIMARY KEY (`id`),
  KEY `cong_viec_id` (`cong_viec_id`),
  CONSTRAINT `cong_viec_quy_trinh_ibfk_1` FOREIGN KEY (`cong_viec_id`) REFERENCES `cong_viec` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=592 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cong_viec_tien_do` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cong_viec_id` int DEFAULT NULL,
  `phan_tram` int DEFAULT NULL,
  `thoi_gian_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cong_viec_id` (`cong_viec_id`),
  CONSTRAINT `cong_viec_tien_do_ibfk_1` FOREIGN KEY (`cong_viec_id`) REFERENCES `cong_viec` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=395 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `don_nghi_phep` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhan_vien_id` int NOT NULL COMMENT 'ID nhân viên gửi đơn',
  `loai_phep` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Loại nghỉ phép: Phép năm, Phép không lương, Nghỉ ốm, Nghỉ thai sản, Nghỉ việc riêng, Khác',
  `ngay_bat_dau` date NOT NULL COMMENT 'Ngày bắt đầu nghỉ',
  `ngay_ket_thuc` date NOT NULL COMMENT 'Ngày kết thúc nghỉ',
  `so_ngay` decimal(4,1) NOT NULL COMMENT 'Số ngày nghỉ (có thể 0.5 cho nửa ngày)',
  `ly_do` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Lý do xin nghỉ',
  `trang_thai` enum('cho_duyet','da_duyet','tu_choi') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_duyet' COMMENT 'Trạng thái đơn',
  `ly_do_tu_choi` text COLLATE utf8mb4_unicode_ci COMMENT 'Lý do từ chối (nếu có)',
  `nguoi_duyet_id` int DEFAULT NULL COMMENT 'ID người duyệt đơn',
  `nguoi_tao_id` int DEFAULT NULL COMMENT 'ID người tạo đơn (nếu admin tạo hộ)',
  `thoi_gian_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo đơn',
  `thoi_gian_duyet` timestamp NULL DEFAULT NULL COMMENT 'Thời gian duyệt/từ chối',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú thêm',
  PRIMARY KEY (`id`),
  KEY `idx_nhan_vien_id` (`nhan_vien_id`),
  KEY `idx_trang_thai` (`trang_thai`),
  KEY `idx_ngay_bat_dau` (`ngay_bat_dau`),
  KEY `idx_nguoi_duyet_id` (`nguoi_duyet_id`),
  CONSTRAINT `fk_don_nghi_phep_nguoiduyet` FOREIGN KEY (`nguoi_duyet_id`) REFERENCES `nhanvien` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_don_nghi_phep_nhanvien` FOREIGN KEY (`nhan_vien_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `du_an` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_du_an` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lead_id` int DEFAULT NULL,
  `muc_do_uu_tien` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nhom_du_an` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phong_ban` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai_duan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_duan_lead` (`lead_id`),
  CONSTRAINT `fk_duan_lead` FOREIGN KEY (`lead_id`) REFERENCES `nhanvien` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `file_dinh_kem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cong_viec_id` int DEFAULT NULL,
  `tien_do_id` int DEFAULT NULL,
  `duong_dan_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `thoi_gian_upload` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cong_viec_id` (`cong_viec_id`),
  KEY `tien_do_id` (`tien_do_id`),
  CONSTRAINT `file_dinh_kem_ibfk_1` FOREIGN KEY (`cong_viec_id`) REFERENCES `cong_viec` (`id`) ON DELETE CASCADE,
  CONSTRAINT `file_dinh_kem_ibfk_2` FOREIGN KEY (`tien_do_id`) REFERENCES `cong_viec_tien_do` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `lich_su_cong_phep` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhan_vien_id` int NOT NULL,
  `nam` int NOT NULL,
  `thang` int DEFAULT NULL COMMENT 'NULL = cộng đầu năm, có giá trị = cộng theo tháng',
  `so_ngay_cong` decimal(4,1) NOT NULL COMMENT 'Số ngày phép được cộng',
  `loai_cong` enum('dau_nam','hang_thang') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Loại cộng phép',
  `ly_do` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngay_cong` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nhan_vien_nam` (`nhan_vien_id`,`nam`),
  CONSTRAINT `fk_lich_su_cong_phep` FOREIGN KEY (`nhan_vien_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `luong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhan_vien_id` int DEFAULT NULL,
  `thang` int DEFAULT NULL,
  `nam` int DEFAULT NULL,
  `luong_co_ban` decimal(12,2) DEFAULT NULL,
  `phu_cap` decimal(12,2) DEFAULT '0.00',
  `thuong` decimal(12,2) DEFAULT '0.00',
  `phat` decimal(12,2) DEFAULT '0.00',
  `bao_hiem` decimal(12,2) DEFAULT '0.00',
  `thue` decimal(12,2) DEFAULT '0.00',
  `luong_thuc_te` decimal(12,2) DEFAULT NULL,
  `ghi_chu` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `trang_thai` enum('Chưa trả','Đã trả') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Chưa trả',
  `ngay_tra_luong` date DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `nhan_vien_id` (`nhan_vien_id`),
  CONSTRAINT `luong_ibfk_1` FOREIGN KEY (`nhan_vien_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `luong_cau_hinh` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_cau_hinh` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gia_tri` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `luu_kpi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhan_vien_id` int DEFAULT NULL,
  `phong_ban_id` int DEFAULT NULL,
  `thang` int DEFAULT NULL,
  `nam` int DEFAULT NULL,
  `tong_task_duoc_giao` int NOT NULL DEFAULT '0',
  `tong_task_hoan_thanh` int NOT NULL DEFAULT '0',
  `tong_task_dung_han` int NOT NULL DEFAULT '0',
  `trung_binh_task_team` decimal(10,2) NOT NULL DEFAULT '0.00',
  `ty_le_hoan_thanh` decimal(5,2) NOT NULL DEFAULT '0.00',
  `ty_le_dung_han` decimal(5,2) NOT NULL DEFAULT '0.00',
  `diem_khoi_luong` decimal(5,2) NOT NULL DEFAULT '0.00',
  `trong_so_hoan_thanh` decimal(5,2) NOT NULL DEFAULT '0.40',
  `trong_so_dung_han` decimal(5,2) NOT NULL DEFAULT '0.40',
  `trong_so_khoi_luong` decimal(5,2) NOT NULL DEFAULT '0.20',
  `diem_kpi` float DEFAULT NULL,
  `he_so_luong` decimal(4,2) NOT NULL DEFAULT '0.70',
  PRIMARY KEY (`id`),
  KEY `nhan_vien_id` (`nhan_vien_id`),
  KEY `idx_luu_kpi_thang_nam` (`thang`,`nam`),
  KEY `idx_luu_kpi_phong_ban` (`phong_ban_id`),
  UNIQUE KEY `uq_luu_kpi_nhanvien_thang_nam` (`nhan_vien_id`,`thang`,`nam`),
  CONSTRAINT `luu_kpi_ibfk_1` FOREIGN KEY (`nhan_vien_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ngay_nghi_le` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_ngay_le` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên ngày lễ',
  `ngay_bat_dau` date NOT NULL COMMENT 'Ngày bắt đầu nghỉ lễ',
  `ngay_ket_thuc` date NOT NULL COMMENT 'Ngày kết thúc nghỉ lễ',
  `lap_lai_hang_nam` tinyint(1) DEFAULT '0' COMMENT '1 = lặp lại hàng năm (Tết, Quốc khánh...)',
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ngay_bat_dau` (`ngay_bat_dau`),
  KEY `idx_ngay_ket_thuc` (`ngay_ket_thuc`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ngay_phep_nam` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhan_vien_id` int NOT NULL,
  `nam` int NOT NULL COMMENT 'Năm',
  `tong_ngay_phep` decimal(4,1) DEFAULT '12.0' COMMENT 'Tổng số ngày phép được cấp',
  `ngay_phep_da_dung` decimal(4,1) DEFAULT '0.0' COMMENT 'Số ngày đã sử dụng',
  `ngay_phep_con_lai` decimal(4,1) DEFAULT '12.0' COMMENT 'Số ngày còn lại',
  `ngay_phep_nam_truoc` decimal(4,1) DEFAULT '0.0' COMMENT 'Số ngày phép năm trước chuyển sang',
  `da_cong_phep_dau_nam` tinyint(1) DEFAULT '0' COMMENT '1 = Đã cộng 12 ngày đầu năm, không cộng hàng tháng nữa',
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nhanvien_nam` (`nhan_vien_id`,`nam`),
  CONSTRAINT `fk_ngay_phep_nhanvien` FOREIGN KEY (`nhan_vien_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `nhan_su_lich_su` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nhan_vien_id` int DEFAULT NULL,
  `loai_thay_doi` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gia_tri_cu` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `gia_tri_moi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `nguoi_thay_doi_id` int DEFAULT NULL,
  `ghi_chu` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `thoi_gian` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `nhan_vien_id` (`nhan_vien_id`),
  KEY `nguoi_thay_doi_id` (`nguoi_thay_doi_id`),
  CONSTRAINT `nhan_su_lich_su_ibfk_1` FOREIGN KEY (`nhan_vien_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE,
  CONSTRAINT `nhan_su_lich_su_ibfk_2` FOREIGN KEY (`nguoi_thay_doi_id`) REFERENCES `nhanvien` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `nhanvien` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ho_ten` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gioi_tinh` enum('Nam','Nữ','Khác') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `phong_ban_id` int DEFAULT NULL,
  `chuc_vu` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `luong_co_ban` decimal(12,2) DEFAULT '0.00',
  `trang_thai_lam_viec` enum('Đang làm','Tạm nghỉ','Nghỉ việc') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Đang làm',
  `vai_tro` enum('Admin','Nhân viên') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nhân viên',
  `ngay_vao_lam` date DEFAULT NULL,
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `phong_ban_id` (`phong_ban_id`),
  CONSTRAINT `nhanvien_ibfk_1` FOREIGN KEY (`phong_ban_id`) REFERENCES `phong_ban` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `nhanvien_quyen` (
  `nhanvien_id` int NOT NULL,
  `quyen_id` int NOT NULL,
  PRIMARY KEY (`nhanvien_id`,`quyen_id`),
  KEY `quyen_id` (`quyen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `phan_quyen_chuc_nang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vai_tro` enum('Admin','Nhân viên') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chuc_nang` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `co_quyen` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `phong_ban` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_phong` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `truong_phong_id` int DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_truong_phong` (`truong_phong_id`),
  CONSTRAINT `fk_truong_phong` FOREIGN KEY (`truong_phong_id`) REFERENCES `nhanvien` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quy_trinh_nguoi_nhan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `step_id` int DEFAULT NULL,
  `nhan_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `nhan_id` (`nhan_id`),
  KEY `quy_trinh_nguoi_nhan_ibfk_1` (`step_id`),
  CONSTRAINT `quy_trinh_nguoi_nhan_ibfk_1` FOREIGN KEY (`step_id`) REFERENCES `cong_viec_quy_trinh` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quy_trinh_nguoi_nhan_ibfk_2` FOREIGN KEY (`nhan_id`) REFERENCES `nhanvien` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=364 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quyen` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_quyen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_quyen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nhom_quyen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_quyen` (`ma_quyen`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `thong_bao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noi_dung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `nguoi_nhan_id` int DEFAULT NULL,
  `loai_thong_bao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `duong_dan` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `da_doc` tinyint(1) DEFAULT '0',
  `ngay_doc` timestamp NULL DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `nguoi_nhan_id` (`nguoi_nhan_id`),
  CONSTRAINT `thong_bao_ibfk_1` FOREIGN KEY (`nguoi_nhan_id`) REFERENCES `nhanvien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3337 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



