200116XA11-1     200116XA10-1          200116XA11-1
200116XA11-2     200116XA10-1          200116XA11-1
200116XA11-3     200116XA10-1          200116XA11-1
200116XA11-4     200116XA10-1          200116XA11-1
200116XA11-5    200116XA10-1          200116XA11-1
200116XA11-6      200116XA10-1          200116XA11-1
200116XA12-1        200116XA11-1          200116XA12-1
200116XA12-2         200116XA11-1          200116XA12-1
200116XA12-3         200116XA11-1          200116XA12-1
200116XA12-4         200116XA11-1          200116XA12-1
200116XA12-5          200116XA11-1          200116XA12-1



update prod_product set attr_group_sku = '200116XA11-1' where sku = '200116XA11-1' AND attr_group_sku = '200116XA10-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA11-1' where sku = '200116XA11-2' AND attr_group_sku = '200116XA10-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA11-1' where sku = '200116XA11-3' AND attr_group_sku = '200116XA10-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA11-1' where sku = '200116XA11-4' AND attr_group_sku = '200116XA10-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA11-1' where sku = '200116XA11-5' AND attr_group_sku = '200116XA10-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA11-1' where sku = '200116XA11-6' AND attr_group_sku = '200116XA10-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA12-1' where sku = '200116XA12-1' AND attr_group_sku = '200116XA11-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA12-1' where sku = '200116XA12-2' AND attr_group_sku = '200116XA11-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA12-1' where sku = '200116XA12-3' AND attr_group_sku = '200116XA11-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA12-1' where sku = '200116XA12-4' AND attr_group_sku = '200116XA11-1' LIMIT 1;
update prod_product set attr_group_sku = '200116XA12-1' where sku = '200116XA12-5' AND attr_group_sku = '200116XA11-1' LIMIT 1;

