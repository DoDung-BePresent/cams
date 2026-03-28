# Component: SettingSwitch

## Overview

A beautifully styled switch component with label and description, perfect for settings pages. Provides a clean, professional look similar to modern app settings interfaces.

## Created Date

2026-03-24

## Location

`src/shared/components/common/SettingSwitch.tsx`

## Design Inspiration

Inspired by modern settings UI patterns (iOS Settings, Android Settings, etc.) where each setting has:

- Clear label (bold, prominent)
- Helpful description (secondary text)
- Toggle switch on the right
- Clean separation between items

## Component API

### Props

```typescript
interface SettingSwitchProps extends Omit<SwitchProps, 'onChange'> {
  label: string; // Main label text (required)
  description?: string; // Helper text below label (optional)
  value?: boolean; // Controlled value
  onChange?: (checked: boolean) => void; // Change handler
  // ... all other Ant Design Switch props
}
```

### Features

1. **Clean Layout**
   - Label and description on the left
   - Switch control on the right
   - Proper spacing and alignment
   - Bottom border for separation

2. **Typography**
   - Label: Bold, 15px, dark color (#262626)
   - Description: Secondary, 13px, gray color (#8c8c8c)

3. **Responsive**
   - Flex layout adapts to container width
   - Description wraps on narrow screens

4. **Accessible**
   - Inherits all Ant Design Switch accessibility features
   - Clear visual hierarchy
   - Proper contrast ratios

## Usage Examples

### Basic Usage

```tsx
import { SettingSwitch } from '@/shared/components';

<SettingSwitch
  label='Auto-save'
  description='Automatically save your work every 5 minutes'
  value={autoSave}
  onChange={setAutoSave}
/>;
```

### Without Description

```tsx
<SettingSwitch
  label='Enable notifications'
  value={notifications}
  onChange={setNotifications}
/>
```

### With Custom Switch Props

```tsx
<SettingSwitch
  label='Dark Mode'
  description='Use dark theme for better visibility at night'
  value={darkMode}
  onChange={setDarkMode}
  checkedChildren='ON'
  unCheckedChildren='OFF'
  disabled={loading}
/>
```

### In Form Context

```tsx
<SettingSwitch
  label="Auto-add to Playlist"
  description="Automatically add generated tracks to the selected playlist"
  value={form.getFieldValue('autoAdd')}
  onChange={(checked) => form.setFieldValue('autoAdd', checked)}
/>

<Form.Item name="autoAdd" hidden initialValue={true}>
  <input type="hidden" />
</Form.Item>
```

### Multiple Settings

```tsx
<div>
  <SettingSwitch
    label='Secure Browsing'
    description="Browsing securely (https) when it's necessary"
    value={secureBrowsing}
    onChange={setSecureBrowsing}
  />

  <SettingSwitch
    label='Login Notifications'
    description='Notify when login attempted from other place'
    value={loginNotifications}
    onChange={setLoginNotifications}
  />

  <SettingSwitch
    label='Login Approvals'
    description='Approvals is not required when login from unrecognized devices'
    value={loginApprovals}
    onChange={setLoginApprovals}
  />
</div>
```

## Applied In

### 1. SunoGenerationForm

**File:** `src/shared/modules/suno/components/SunoGenerationForm.tsx`

**Before:**

```tsx
<Form.Item label='Prompt Mode'>
  <Space>
    <Switch
      checked={useTemplate}
      onChange={setUseTemplate}
      checkedChildren='Use Template'
      unCheckedChildren='Manual Prompt'
    />
    <span style={{ color: '#999', fontSize: 12 }}>
      {useTemplate ? 'Using configured template' : 'Write custom prompt'}
    </span>
  </Space>
</Form.Item>
```

**After:**

```tsx
<SettingSwitch
  label='Prompt Mode'
  description={
    useTemplate
      ? 'Using configured template - fill fields to generate prompt'
      : 'Write custom prompt manually'
  }
  value={useTemplate}
  onChange={setUseTemplate}
  checkedChildren='Template'
  unCheckedChildren='Manual'
/>
```

**Benefits:**

- Cleaner code (8 lines → 4 lines)
- Better visual hierarchy
- Consistent styling
- More professional appearance

### 2. Auto-add to Playlist Setting

**Before:**

```tsx
<Form.Item
  name='autoAddToTargetPlaylist'
  label='Auto-add to Playlist'
  valuePropName='checked'
  initialValue={true}
>
  <Switch />
</Form.Item>
```

**After:**

```tsx
<SettingSwitch
  label='Auto-add to Playlist'
  description='Automatically add generated track to the selected playlist when completed'
  value={form.getFieldValue('autoAddToTargetPlaylist') ?? true}
  onChange={(checked) => form.setFieldValue('autoAddToTargetPlaylist', checked)}
/>

<Form.Item name='autoAddToTargetPlaylist' hidden initialValue={true}>
  <input type="hidden" />
</Form.Item>
```

**Benefits:**

- Clear description of what the setting does
- Better UX with helpful text
- Maintains form state with hidden field
- Professional appearance

## Styling Details

### Container

```css
display: flex;
justify-content: space-between;
align-items: center;
padding: 16px 0;
border-bottom: 1px solid #f0f0f0;
```

### Label

```css
font-weight: bold;
font-size: 15px;
color: #262626;
```

### Description

```css
font-size: 13px;
color: #8c8c8c;
```

## Customization

### Remove Border

```tsx
<div style={{ borderBottom: 'none' }}>
  <SettingSwitch ... />
</div>
```

### Custom Padding

```tsx
<div style={{ padding: '24px 0' }}>
  <SettingSwitch ... />
</div>
```

### Custom Colors

```tsx
<SettingSwitch
  label={<span style={{ color: 'red' }}>Important Setting</span>}
  description={<span style={{ color: 'orange' }}>This is critical</span>}
  ...
/>
```

## Comparison with Standard Switch

### Standard Ant Design Switch

```tsx
<Form.Item
  label='Setting'
  valuePropName='checked'
>
  <Switch />
</Form.Item>
```

**Pros:**

- Simple
- Built-in form integration

**Cons:**

- No description support
- Less visual hierarchy
- Requires Form.Item wrapper
- Less professional appearance

### SettingSwitch

```tsx
<SettingSwitch
  label='Setting'
  description='Helpful description'
  value={value}
  onChange={setValue}
/>
```

**Pros:**

- Built-in description
- Better visual hierarchy
- Professional appearance
- Flexible (works with or without forms)
- Consistent styling

**Cons:**

- Requires manual form state management (if using forms)

## Best Practices

### 1. Always Provide Description

```tsx
// ✅ Good
<SettingSwitch
  label="Auto-save"
  description="Save your work automatically every 5 minutes"
  ...
/>

// ❌ Avoid (unless obvious)
<SettingSwitch
  label="Auto-save"
  ...
/>
```

### 2. Keep Labels Short

```tsx
// ✅ Good
<SettingSwitch
  label="Email Notifications"
  description="Receive email when someone mentions you"
  ...
/>

// ❌ Avoid
<SettingSwitch
  label="Email Notifications for Mentions and Comments"
  description="..."
  ...
/>
```

### 3. Use Action-Oriented Descriptions

```tsx
// ✅ Good
<SettingSwitch
  label="Dark Mode"
  description="Use dark theme for better visibility at night"
  ...
/>

// ❌ Avoid
<SettingSwitch
  label="Dark Mode"
  description="This is the dark mode setting"
  ...
/>
```

### 4. Group Related Settings

```tsx
<Card title="Security Settings">
  <SettingSwitch label="Two-Factor Auth" ... />
  <SettingSwitch label="Login Alerts" ... />
  <SettingSwitch label="Session Timeout" ... />
</Card>
```

## Accessibility

- ✅ Keyboard navigable (inherits from Ant Design Switch)
- ✅ Screen reader friendly
- ✅ Clear visual hierarchy
- ✅ Proper color contrast (WCAG AA compliant)
- ✅ Focus indicators

## Browser Support

Same as Ant Design Switch:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

### Potential Improvements

1. Add loading state
2. Add disabled state styling
3. Add tooltip support
4. Add icon support
5. Add badge/tag support
6. Add animation on toggle

### Example Future API

```tsx
<SettingSwitch
  label='Premium Feature'
  description='Unlock advanced features'
  value={premium}
  onChange={setPremium}
  icon={<StarOutlined />}
  badge='NEW'
  loading={checking}
  tooltip='Requires subscription'
/>
```

## Related Components

- `Switch` - Ant Design base switch
- `Form.Item` - Ant Design form item
- `Space` - Ant Design spacing
- `Typography.Text` - Ant Design text

## Testing

### Unit Test Example

```tsx
import { render, fireEvent } from '@testing-library/react';
import { SettingSwitch } from './SettingSwitch';

test('calls onChange when toggled', () => {
  const handleChange = jest.fn();
  const { getByRole } = render(
    <SettingSwitch
      label='Test'
      description='Test description'
      value={false}
      onChange={handleChange}
    />,
  );

  const switchElement = getByRole('switch');
  fireEvent.click(switchElement);

  expect(handleChange).toHaveBeenCalledWith(true);
});
```

## Performance

- Lightweight component (~50 lines)
- No heavy dependencies
- Minimal re-renders
- Efficient layout with flexbox

## Migration Guide

### From Standard Switch to SettingSwitch

**Step 1:** Import SettingSwitch

```tsx
import { SettingSwitch } from '@/shared/components';
```

**Step 2:** Replace Form.Item + Switch

```tsx
// Before
<Form.Item label="Setting" valuePropName="checked">
  <Switch />
</Form.Item>

// After
<SettingSwitch
  label="Setting"
  description="Helpful description"
  value={form.getFieldValue('setting')}
  onChange={(checked) => form.setFieldValue('setting', checked)}
/>
<Form.Item name="setting" hidden>
  <input type="hidden" />
</Form.Item>
```

**Step 3:** Test thoroughly

- Verify form submission
- Check initial values
- Test toggle behavior

## Conclusion

SettingSwitch provides a professional, user-friendly way to display toggle settings with clear labels and helpful descriptions. It's perfect for settings pages, configuration forms, and any interface where users need to enable/disable features.

The component strikes a balance between simplicity and functionality, making it easy to use while providing a polished user experience.
