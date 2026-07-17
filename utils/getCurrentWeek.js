module.exports = function(){

return (
new Date().getFullYear()
+
"-"
+
Math.ceil(
(
(new Date()-new Date(new Date().getFullYear(),0,1))
/86400000+1
)/7
)

);

};
