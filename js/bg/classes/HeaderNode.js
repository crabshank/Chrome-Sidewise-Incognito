/**
  * @constructor
  * @extends PageTreeNode
  */
var HeaderNode = function(label)
{
    this.$base();

    this.elemType = 'header';
    this.id = 'h' + this.UUID;

    this.label = label;

    this.collecting = false;    // Set to true when a HeaderNode in the recently closed tree is 'collecting' tab closures
};

HeaderNode.prototype = {
};

extendClass(HeaderNode, PageTreeNode, HeaderNode.prototype);
