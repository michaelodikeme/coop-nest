Fluid grids

Fluid grids use columns that scale and resize content. A fluid grid's layout can use breakpoints to determine if the layout needs to change dramatically.

Basic grid

In order to create a grid layout, you need a container. Use the container prop to create a grid container that wraps the grid items (the Grid is always an item).

Column widths are integer values between 1 and 12. For example, an item with size={6} occupies half of the grid container's width.

size=8
size=4
size=4
size=8
<Grid container spacing={2}>
  <Grid size={8}>
    <Item>size=8</Item>
  </Grid>
  <Grid size={4}>
    <Item>size=4</Item>
  </Grid>
  <Grid size={4}>
    <Item>size=4</Item>
  </Grid>
  <Grid size={8}>
    <Item>size=8</Item>
  </Grid>
</Grid>
<Grid container spacing={2}>
  <Grid size={8}>
    <Item>size=8</Item>
  </Grid>
  <Grid size={4}>
    <Item>size=4</Item>
  </Grid>
  <Grid size={4}>
    <Item>size=4</Item>
  </Grid>
  <Grid size={8}>
    <Item>size=8</Item>
  </Grid>
</Grid>
Press Enter to start editing
Multiple breakpoints

Items may have multiple widths defined, causing the layout to change at the defined breakpoint. Width values apply to all wider breakpoints, and larger breakpoints override those given to smaller breakpoints.

For example, a component with size={{ xs: 12, sm: 6 }} occupies the entire viewport width when the viewport is less than 600 pixels wide. When the viewport grows beyond this size, the component occupies half of the total width—six columns rather than 12.

xs=6 md=8
xs=6 md=4
xs=6 md=4
xs=6 md=8
<Grid container spacing={2}>
  <Grid size={{ xs: 6, md: 8 }}>
    <Item>xs=6 md=8</Item>
  </Grid>
  <Grid size={{ xs: 6, md: 4 }}>
    <Item>xs=6 md=4</Item>
  </Grid>
  <Grid size={{ xs: 6, md: 4 }}>
    <Item>xs=6 md=4</Item>
  </Grid>
  <Grid size={{ xs: 6, md: 8 }}>
    <Item>xs=6 md=8</Item>
  </Grid>
</Grid>
<Grid container spacing={2}>
  <Grid size={{ xs: 6, md: 8 }}>
    <Item>xs=6 md=8</Item>
  </Grid>
  <Grid size={{ xs: 6, md: 4 }}>
    <Item>xs=6 md=4</Item>
  </Grid>
  <Grid size={{ xs: 6, md: 4 }}>
    <Item>xs=6 md=4</Item>
  </Grid>
  <Grid size={{ xs: 6, md: 8 }}>
    <Item>xs=6 md=8</Item>
  </Grid>
</Grid>
Press Enter to start editing
Spacing

Use the spacing prop to control the space between children. The spacing value can be any positive number (including decimals) or a string. The prop is converted into a CSS property using the theme.spacing() helper.

The following demo illustrates the use of the spacing prop:

spacing
0
0.5
1
2
3
4
8
12
Copy
<Grid container spacing={2}>
Row and column spacing

The rowSpacing and columnSpacing props let you specify row and column gaps independently of one another. They behave similarly to the row-gap and column-gap properties of CSS Grid.

1
2
3
4
<Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
  <Grid size={6}>
    <Item>1</Item>
  </Grid>
  <Grid size={6}>
    <Item>2</Item>
  </Grid>
  <Grid size={6}>
    <Item>3</Item>
  </Grid>
  <Grid size={6}>
    <Item>4</Item>
  </Grid>
</Grid>
<Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
  <Grid size={6}>
    <Item>1</Item>
  </Grid>
  <Grid size={6}>
    <Item>2</Item>
  </Grid>
  <Grid size={6}>
    <Item>3</Item>
  </Grid>
  <Grid size={6}>
    <Item>4</Item>
  </Grid>
</Grid>
Press Enter to start editing
Responsive values

You can set prop values to change when a given breakpoint is active. For instance, we can implement Material Design's recommended responsive layout grid, as seen in the following demo:

1
2
3
4
5
6
<Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
  {Array.from(Array(6)).map((_, index) => (
    <Grid key={index} size={{ xs: 2, sm: 4, md: 4 }}>
      <Item>{index + 1}</Item>
    </Grid>
  ))}
</Grid>
<Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
  {Array.from(Array(6)).map((_, index) => (
    <Grid key={index} size={{ xs: 2, sm: 4, md: 4 }}>
      <Item>{index + 1}</Item>
    </Grid>
  ))}
</Grid>
Press Enter to start editing
Responsive values are supported by:

size
columns
columnSpacing
direction
rowSpacing
spacing
offset