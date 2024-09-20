# 迁移教程

## 从 `GZTimeWalker/GZCTF` 迁移

由于数据库变更, 需要手动迁移数据.

执行 SQL 文件 [migrate-from.sql](migrate-from.sql) 进行迁移.

你可以将此文件上传到服务器上

以下是你可能用得到的指令

```bash
docker compose exec db psql -U postgres -d gzctf
```

将 [migrate-from.sql](migrate-from.sql) 内容复制到其中执行.


## 迁移回 `GZTimeWalker/GZCTF`

由于数据库变更, 需要手动迁移数据.

执行 SQL 文件 [migrate-back.sql](migrate-back.sql) 进行迁移.