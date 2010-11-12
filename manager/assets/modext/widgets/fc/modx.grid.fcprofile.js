MODx.panel.FCProfiles = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        id: 'modx-panel-fc-profiles'
        ,defaults: { collapsible: false ,autoHeight: true }
        ,items: [{
             html: '<h2>'+_('form_customization')+'</h2>'
            ,border: false
            ,cls: 'modx-page-header'
            ,id: 'modx-fcp-header'
        },MODx.getPageStructure([{
            title: _('profiles')
            ,bodyStyle: 'padding: 15px;'
            ,autoHeight: true
            ,items: [{
                html: '<p>'+_('form_customization_msg')+'</p>'
                ,border: false
            },{
                title: ''
                ,preventRender: true
                ,xtype: 'modx-grid-fc-profile'
            }]
        }],{
            id: 'modx-form-customization-tabs'
        })]
    });
    MODx.panel.FCProfiles.superclass.constructor.call(this,config);
};
Ext.extend(MODx.panel.FCProfiles,MODx.FormPanel);
Ext.reg('modx-panel-fc-profiles',MODx.panel.FCProfiles);

MODx.grid.FCProfile = function(config) {
    config = config || {};
    this.sm = new Ext.grid.CheckboxSelectionModel();
    Ext.applyIf(config,{
        id: 'modx-grid-fc-profile'
        ,url: MODx.config.connectors_url+'security/forms/profile.php'
        ,fields: ['id','name','description','usergroup','active','rank','sets','perm']
        ,paging: true
        ,autosave: true
        ,sm: this.sm
        ,remoteSort: true
        ,columns: [this.sm,{
            header: _('id')
            ,dataIndex: 'id'
            ,width: 40
            ,sortable: true
        },{
            header: _('name')
            ,dataIndex: 'name'
            ,width: 200
            ,sortable: true
            ,editor: { xtype: 'textfield' }
        },{
            header: _('description')
            ,dataIndex: 'description'
            ,width: 250
            ,sortable: true
            ,editor: { xtype: 'textfield' }
        },{
            header: _('usergroup')
            ,dataIndex: 'usergroup'
            ,width: 150
            ,editor: { xtype: 'modx-combo-usergroup' ,renderer: true, baseParams: { action: 'getList', addNone: true }}
            ,editable: true
            ,sortable: true
        },{
            header: _('rank')
            ,dataIndex: 'rank'
            ,width: 70
            ,editor: { xtype: 'textfield' }
            ,editable: true
            ,sortable: true
        }]
        ,viewConfig: {
            forceFit:true
            ,enableRowBody:true
            ,scrollOffset: 0
            ,autoFill: true
            ,showPreview: true
            ,getRowClass : function(rec, ri, p){
                return rec.data.active ? 'grid-row-active' : 'grid-row-inactive';
            }
        }
        ,tbar: [{
            text: _('profile_create')
            ,scope: this
            ,handler: { xtype: 'modx-window-actiondom-create' ,blankValues: true }
        },'-',{
            text: _('bulk_actions')
            ,menu: [{
                text: _('selected_activate')
                ,handler: this.activateSelected
                ,scope: this
            },{
                text: _('selected_deactivate')
                ,handler: this.deactivateSelected
                ,scope: this
            },'-',{
                text: _('selected_remove')
                ,handler: this.removeSelected
                ,scope: this
            }]
        },{
            xtype: 'textfield'
            ,name: 'search'
            ,id: 'modx-fcp-search'
            ,emptyText: _('filter_by_search')
            ,listeners: {
                'change': {fn: this.search, scope: this}
                ,'render': {fn: function(cmp) {
                    new Ext.KeyMap(cmp.getEl(), {
                        key: Ext.EventObject.ENTER
                        ,fn: function() {
                            this.fireEvent('change',this.getValue());
                            this.blur();
                            return true;}
                        ,scope: cmp
                    });
                },scope:this}
            }
        },{
            xtype: 'button'
            ,id: 'modx-filter-clear'
            ,text: _('filter_clear')
            ,listeners: {
                'click': {fn: this.clearFilter, scope: this}
            }
        }]
    });
    MODx.grid.FCProfile.superclass.constructor.call(this,config);
    this.on('render',function() { this.getStore().reload(); },this);
};
Ext.extend(MODx.grid.FCProfile,MODx.grid.Grid,{
    getMenu: function() {
        var r = this.getSelectionModel().getSelected();
        var p = r.data.perm;

        var m = [];
        if (this.getSelectionModel().getCount() > 1) {
            m.push({
                text: _('selected_activate')
                ,handler: this.activateSelected
            });
            m.push({
                text: _('selected_deactivate')
                ,handler: this.deactivateSelected
            });
            m.push('-');
            m.push({
                text: _('selected_remove')
                ,handler: this.removeSelected
            });
        } else {
            if (p.indexOf('pedit') != -1) {
                m.push({
                    text: _('edit')
                    ,handler: this.updateProfile
                },{
                    text: _('duplicate')
                    ,handler: this.duplicateProfile
                },'-');
                if (r.data.active) {
                    m.push({
                        text: _('deactivate')
                        ,handler: this.deactivateProfile
                    });
                } else {
                    m.push({
                        text: _('activate')
                        ,handler: this.activateProfile
                    });
                }
            }
            if (p.indexOf('premove') != -1) {
                m.push('-',{
                    text: _('remove')
                    ,handler: this.confirm.createDelegate(this,['remove','rule_remove_confirm'])
                });
            }
        }

        if (m.length > 0) {
            this.addContextMenuItem(m);
        }
    }

    ,search: function(tf,newValue,oldValue) {
        var nv = newValue || tf;
        this.getStore().baseParams.search = Ext.isEmpty(nv) || Ext.isObject(nv) ? '' : nv;
        this.getStore().baseParams.controller = '';
        Ext.getCmp('modx-fcp-filter-action').setValue('');
        this.getBottomToolbar().changePage(1);
        this.refresh();
        return true;
    }
    ,clearFilter: function() {
    	this.getStore().baseParams = {
            action: 'getList'
    	};
        Ext.getCmp('modx-fcp-search').reset();
    	this.getBottomToolbar().changePage(1);
        this.refresh();
    }

    ,updateProfile: function(btn,e) {
        var r = this.menu.record;
        location.href = '?a='+MODx.action['security/forms/profile/update']+'&id='+r.id;
    }
    ,duplicateProfile: function(btn,e) {
        MODx.Ajax.request({
            url: this.config.url
            ,params: {
                action: 'duplicate'
                ,id: this.menu.record.id
            }
            ,listeners: {
                'success': {fn:this.refresh,scope:this}
            }
        });
    }

    ,activateProfile: function(btn,e) {
        MODx.Ajax.request({
            url: this.config.url
            ,params: {
                action: 'activate'
                ,id: this.menu.record.id
            }
            ,listeners: {
                'success': {fn:this.refresh,scope:this}
            }
        });
    }

    ,activateSelected: function() {
        var cs = this.getSelectedAsList();
        if (cs === false) return false;

        MODx.Ajax.request({
            url: this.config.url
            ,params: {
                action: 'activateMultiple'
                ,rules: cs
            }
            ,listeners: {
                'success': {fn:function(r) {
                    this.getSelectionModel().clearSelections(true);
                    this.refresh();
                },scope:this}
            }
        });
        return true;
    }
    ,deactivateProfile: function(btn,e) {
        MODx.Ajax.request({
            url: this.config.url
            ,params: {
                action: 'deactivate'
                ,id: this.menu.record.id
            }
            ,listeners: {
                'success': {fn:this.refresh,scope:this}
            }
        });
    }
    ,deactivateSelected: function() {
        var cs = this.getSelectedAsList();
        if (cs === false) return false;

        MODx.Ajax.request({
            url: this.config.url
            ,params: {
                action: 'deactivateMultiple'
                ,rules: cs
            }
            ,listeners: {
                'success': {fn:function(r) {
                    this.getSelectionModel().clearSelections(true);
                    this.refresh();
                },scope:this}
            }
        });
        return true;
    }
    ,removeSelected: function() {
        var cs = this.getSelectedAsList();
        if (cs === false) return false;

        MODx.msg.confirm({
            title: _('profile_remove_multiple')
            ,text: _('profile_remove_multiple_confirm')
            ,url: this.config.url
            ,params: {
                action: 'removeMultiple'
                ,rules: cs
            }
            ,listeners: {
                'success': {fn:function(r) {
                    this.getSelectionModel().clearSelections(true);
                    this.refresh();
                },scope:this}
            }
        });
        return true;
    }
});
Ext.reg('modx-grid-fc-profile',MODx.grid.FCProfile);